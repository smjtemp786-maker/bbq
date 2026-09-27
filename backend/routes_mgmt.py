"""Management routes: centers, licenses, users (trainers/students), batches, attendance."""
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, HTTPException, Depends
from core import db, require_roles, get_current_user, clean, now_iso, new_id, hash_password, ROLES
from models import (CenterCreate, CenterUpdate, LicenseCreate, UserCreate, UserUpdate,
                    BatchCreate, BatchUpdate, EnrollRequest)

router = APIRouter(tags=["management"])


def scope_center(user):
    """Return center_id a non-superadmin is limited to."""
    return user.get("center_id")


# ---------------- Centers ----------------
@router.get("/centers")
async def list_centers(user: dict = Depends(get_current_user)):
    q = {}
    if user["role"] != "super_admin":
        q = {"id": scope_center(user)}
    centers = await db.centers.find(q, {"_id": 0}).to_list(500)
    for c in centers:
        clean(c)
        c["student_count"] = await db.users.count_documents({"center_id": c["id"], "role": "student"})
        c["trainer_count"] = await db.users.count_documents({"center_id": c["id"], "role": "trainer"})
    return [clean(c) for c in centers]


@router.post("/centers")
async def create_center(body: CenterCreate, user: dict = Depends(require_roles("super_admin"))):
    cid = new_id()
    doc = {"id": cid, **body.model_dump(), "status": "active", "created_at": now_iso(), "updated_at": now_iso()}
    await db.centers.insert_one(doc)
    return clean(doc)


@router.get("/centers/{center_id}")
async def get_center(center_id: str, user: dict = Depends(get_current_user)):
    if user["role"] != "super_admin" and scope_center(user) != center_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    c = await db.centers.find_one({"id": center_id}, {"_id": 0})
    if not c:
        raise HTTPException(status_code=404, detail="Center not found")
    c["license"] = clean(await db.licenses.find_one({"center_id": center_id}) or {}) or None
    return clean(c)


@router.put("/centers/{center_id}")
async def update_center(center_id: str, body: CenterUpdate, user: dict = Depends(require_roles("super_admin", "center_admin"))):
    if user["role"] == "center_admin" and scope_center(user) != center_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    updates["updated_at"] = now_iso()
    await db.centers.update_one({"id": center_id}, {"$set": updates})
    return clean(await db.centers.find_one({"id": center_id}))


# ---------------- Licenses ----------------
@router.get("/licenses")
async def list_licenses(user: dict = Depends(get_current_user)):
    q = {} if user["role"] == "super_admin" else {"center_id": scope_center(user)}
    lics = await db.licenses.find(q, {"_id": 0}).to_list(500)
    centers = {c["id"]: c["name"] for c in await db.centers.find({}, {"_id": 0}).to_list(500)}
    for l in lics:
        l["center_name"] = centers.get(l["center_id"], "Unknown")
    return [clean(l) for l in lics]


@router.post("/licenses")
async def create_license(body: LicenseCreate, user: dict = Depends(require_roles("super_admin"))):
    doc = {
        "id": new_id(), "center_id": body.center_id, "plan": body.plan,
        "activation_date": now_iso(),
        "expiry_date": (datetime.now(timezone.utc) + timedelta(days=30 * body.valid_months)).isoformat(),
        "max_students": body.max_students, "status": "active",
        "key": "BB-" + new_id().split("-")[0].upper(),
        "created_at": now_iso(), "updated_at": now_iso(),
    }
    await db.licenses.insert_one(doc)
    return clean(doc)


@router.post("/licenses/activate")
async def activate_license(payload: dict, user: dict = Depends(get_current_user)):
    key = payload.get("key", "")
    lic = await db.licenses.find_one({"key": key}, {"_id": 0})
    if not lic:
        raise HTTPException(status_code=404, detail="Invalid license key")
    lic["center"] = await db.centers.find_one({"id": lic["center_id"]}, {"_id": 0}) or {}
    return {"valid": lic["status"] == "active", "license": lic}


# ---------------- Users (trainers & students) ----------------
@router.get("/users")
async def list_users(role: str = None, center_id: str = None, user: dict = Depends(get_current_user)):
    q = {}
    if role:
        q["role"] = role
    if user["role"] == "super_admin":
        if center_id:
            q["center_id"] = center_id
    else:
        q["center_id"] = scope_center(user)
    users = await db.users.find(q).to_list(1000)
    return [clean(u) for u in users]


@router.post("/users")
async def create_user(body: UserCreate, user: dict = Depends(require_roles("super_admin", "center_admin"))):
    if body.role not in ROLES:
        raise HTTPException(status_code=400, detail="Invalid role")
    email = body.email.lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    center_id = body.center_id if user["role"] == "super_admin" else scope_center(user)
    doc = {
        "id": new_id(), "name": body.name, "email": email,
        "password_hash": hash_password(body.password), "role": body.role,
        "center_id": center_id, "status": "active", "avatar": "",
        "created_at": now_iso(), "updated_at": now_iso(),
    }
    await db.users.insert_one(doc)
    return clean(doc)


@router.get("/users/{user_id}")
async def get_user(user_id: str, user: dict = Depends(get_current_user)):
    u = await db.users.find_one({"id": user_id})
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    if user["role"] == "student" and user["id"] != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    return clean(u)


@router.put("/users/{user_id}")
async def update_user(user_id: str, body: UserUpdate, user: dict = Depends(require_roles("super_admin", "center_admin"))):
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    updates["updated_at"] = now_iso()
    await db.users.update_one({"id": user_id}, {"$set": updates})
    return clean(await db.users.find_one({"id": user_id}))


# ---------------- Batches ----------------
@router.get("/batches")
async def list_batches(user: dict = Depends(get_current_user)):
    q = {}
    if user["role"] == "center_admin":
        q["center_id"] = scope_center(user)
    elif user["role"] == "trainer":
        q["trainer_id"] = user["id"]
    elif user["role"] == "student":
        q["student_ids"] = user["id"]
    batches = await db.batches.find(q, {"_id": 0}).to_list(500)
    trainers = {u["id"]: u["name"] for u in await db.users.find({"role": "trainer"}, {"_id": 0}).to_list(500)}
    for b in batches:
        b["trainer_name"] = trainers.get(b.get("trainer_id"), "Unassigned")
        b["student_count"] = len(b.get("student_ids", []))
    return [clean(b) for b in batches]


@router.post("/batches")
async def create_batch(body: BatchCreate, user: dict = Depends(require_roles("center_admin", "super_admin"))):
    doc = {
        "id": new_id(), "center_id": scope_center(user), "name": body.name,
        "trainer_id": body.trainer_id, "course_ids": body.course_ids, "student_ids": [],
        "schedule": body.schedule, "start_date": body.start_date, "end_date": body.end_date,
        "status": "active", "created_at": now_iso(), "updated_at": now_iso(),
    }
    await db.batches.insert_one(doc)
    return clean(doc)


@router.put("/batches/{batch_id}")
async def update_batch(batch_id: str, body: BatchUpdate, user: dict = Depends(require_roles("center_admin", "super_admin", "trainer"))):
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    updates["updated_at"] = now_iso()
    await db.batches.update_one({"id": batch_id}, {"$set": updates})
    return clean(await db.batches.find_one({"id": batch_id}))


@router.post("/batches/{batch_id}/enroll")
async def enroll_students(batch_id: str, body: EnrollRequest, user: dict = Depends(require_roles("center_admin", "super_admin"))):
    batch = await db.batches.find_one({"id": batch_id})
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    ids = list(set(batch.get("student_ids", []) + body.student_ids))
    await db.batches.update_one({"id": batch_id}, {"$set": {"student_ids": ids, "updated_at": now_iso()}})
    return clean(await db.batches.find_one({"id": batch_id}))


# ---------------- Attendance ----------------
@router.get("/attendance")
async def get_attendance(batch_id: str = None, date: str = None, user: dict = Depends(get_current_user)):
    q = {}
    if batch_id:
        q["batch_id"] = batch_id
    if date:
        q["date"] = date
    recs = await db.attendance.find(q).to_list(2000)
    return [clean(r) for r in recs]


@router.post("/attendance")
async def mark_attendance(payload: dict, user: dict = Depends(require_roles("center_admin", "trainer", "super_admin"))):
    batch_id = payload["batch_id"]
    date = payload["date"]
    records = payload.get("records", [])  # [{student_id, status}]
    for r in records:
        await db.attendance.update_one(
            {"batch_id": batch_id, "date": date, "student_id": r["student_id"]},
            {"$set": {"id": new_id(), "center_id": scope_center(user), "batch_id": batch_id,
                      "date": date, "student_id": r["student_id"], "status": r["status"],
                      "updated_at": now_iso()}},
            upsert=True)
    return {"ok": True, "count": len(records)}
