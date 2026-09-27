"""Offline-first sync routes: push queued local actions, pull server state."""
from fastapi import APIRouter, Depends
from core import db, get_current_user, clean, now_iso, new_id
from models import SyncPushRequest, SyncPullRequest

router = APIRouter(prefix="/sync", tags=["sync"])

# Map entity -> collection & handler for idempotent upsert by client id
ENTITY_COLLECTIONS = {
    "project": "projects",
    "progress": "student_progress",
    "quiz_attempt": "quiz_attempts",
}


@router.post("/push")
async def sync_push(body: SyncPushRequest, user: dict = Depends(get_current_user)):
    """Accept a batch of local actions. Idempotent via client_id dedupe."""
    results = []
    for item in body.items:
        client_id = item.get("client_id") or new_id()
        entity = item.get("entity")
        action = item.get("action", "upsert")
        payload = item.get("payload", {})
        # dedupe: skip if already processed
        existing = await db.sync_queue.find_one({"client_id": client_id, "status": "synced"})
        if existing:
            results.append({"client_id": client_id, "status": "duplicate"})
            continue
        collection = ENTITY_COLLECTIONS.get(entity)
        status = "synced"
        error = None
        try:
            if collection:
                payload["owner_id"] = payload.get("owner_id") or user["id"]
                payload["student_id"] = payload.get("student_id") or user["id"]
                doc_id = payload.get("id") or new_id()
                payload["id"] = doc_id
                payload["updated_at"] = now_iso()
                if action == "delete":
                    await db[collection].delete_one({"id": doc_id})
                else:
                    await db[collection].update_one({"id": doc_id}, {"$set": payload}, upsert=True)
            else:
                status = "failed"
                error = f"Unknown entity {entity}"
        except Exception as e:  # noqa
            status = "failed"
            error = str(e)
        await db.sync_queue.update_one(
            {"client_id": client_id},
            {"$set": {"id": new_id(), "client_id": client_id, "user_id": user["id"],
                      "entity": entity, "action": action, "status": status,
                      "error": error, "retries": item.get("retries", 0),
                      "synced_at": now_iso() if status == "synced" else None,
                      "created_at": item.get("created_at", now_iso())}},
            upsert=True)
        results.append({"client_id": client_id, "status": status, "error": error})
    return {"results": results, "synced_at": now_iso()}


@router.post("/pull")
async def sync_pull(body: SyncPullRequest, user: dict = Depends(get_current_user)):
    """Return the user's server-side data so the local cache can refresh."""
    projects = await db.projects.find({"owner_id": user["id"]}, {"_id": 0}).to_list(500)
    progress = await db.student_progress.find({"student_id": user["id"]}, {"_id": 0}).to_list(2000)
    attempts = await db.quiz_attempts.find({"student_id": user["id"]}, {"_id": 0}).to_list(500)
    achievements = await db.achievements.find({"student_id": user["id"]}, {"_id": 0}).to_list(200)
    return {"projects": projects, "progress": progress, "quiz_attempts": attempts,
            "achievements": achievements, "pulled_at": now_iso()}


@router.get("/status")
async def sync_status(user: dict = Depends(get_current_user)):
    pending = await db.sync_queue.count_documents({"user_id": user["id"], "status": {"$ne": "synced"}})
    synced = await db.sync_queue.count_documents({"user_id": user["id"], "status": "synced"})
    recent = await db.sync_queue.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(20)
    return {"pending": pending, "synced": synced, "recent": recent}
