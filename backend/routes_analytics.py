"""Analytics routes for global / center / trainer / student scopes."""
from fastapi import APIRouter, Depends, HTTPException
from core import db, require_roles, get_current_user, clean

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/global")
async def global_analytics(user: dict = Depends(require_roles("super_admin"))):
    centers = await db.centers.count_documents({})
    students = await db.users.count_documents({"role": "student"})
    trainers = await db.users.count_documents({"role": "trainer"})
    active_students = await db.users.count_documents({"role": "student", "status": "active"})
    projects = await db.projects.count_documents({})
    attempts = await db.quiz_attempts.find({}).to_list(5000)
    scores = [a["percentage"] for a in attempts if "percentage" in a]
    avg_score = round(sum(scores) / len(scores)) if scores else 0
    certs = await db.certificates.count_documents({})
    # per-course completion
    course_stats = []
    for c in await db.courses.find({}).to_list(200):
        total = await db.lessons.count_documents({"course_id": c["id"]})
        completed = await db.student_progress.count_documents({"course_id": c["id"], "status": "completed", "lesson_id": {"$ne": None}})
        course_stats.append({"title": c["title"], "category": c["category"],
                             "completion": round(completed / (total or 1)), "enrolled": completed})
    # per-center students
    center_stats = []
    for c in await db.centers.find({}).to_list(200):
        center_stats.append({"name": c["name"],
                             "students": await db.users.count_documents({"center_id": c["id"], "role": "student"}),
                             "trainers": await db.users.count_documents({"center_id": c["id"], "role": "trainer"})})
    return {"total_centers": centers, "total_students": students, "active_students": active_students,
            "total_trainers": trainers, "projects_created": projects, "avg_quiz_score": avg_score,
            "certificates_issued": certs, "course_stats": course_stats, "center_stats": center_stats}


@router.get("/center")
async def center_analytics(center_id: str = None, user: dict = Depends(get_current_user)):
    cid = center_id if user["role"] == "super_admin" and center_id else user.get("center_id")
    if not cid:
        raise HTTPException(status_code=400, detail="No center scope")
    student_docs = await db.users.find({"center_id": cid, "role": "student"}).to_list(2000)
    student_ids = [s["id"] for s in student_docs]
    batches = await db.batches.count_documents({"center_id": cid})
    trainers = await db.users.count_documents({"center_id": cid, "role": "trainer"})
    attempts = await db.quiz_attempts.find({"student_id": {"$in": student_ids}}).to_list(5000)
    scores = [a["percentage"] for a in attempts if "percentage" in a]
    avg_score = round(sum(scores) / len(scores)) if scores else 0
    projects = await db.projects.count_documents({"owner_id": {"$in": student_ids}})
    lessons_completed = await db.student_progress.count_documents({"student_id": {"$in": student_ids}, "status": "completed", "lesson_id": {"$ne": None}})
    active = len([s for s in student_docs if s.get("status") == "active"])
    return {"total_students": len(student_docs), "active_students": active, "total_batches": batches,
            "total_trainers": trainers, "avg_quiz_score": avg_score, "projects_created": projects,
            "lessons_completed": lessons_completed}


@router.get("/trainer")
async def trainer_analytics(user: dict = Depends(require_roles("trainer", "super_admin", "center_admin"))):
    batches = await db.batches.find({"trainer_id": user["id"]}).to_list(200)
    student_ids = []
    for b in batches:
        student_ids += b.get("student_ids", [])
    student_ids = list(set(student_ids))
    students = await db.users.find({"id": {"$in": student_ids}}).to_list(2000)
    rows = []
    for s in students:
        recs = await db.student_progress.find({"student_id": s["id"], "status": "completed", "lesson_id": {"$ne": None}}).to_list(2000)
        attempts = await db.quiz_attempts.find({"student_id": s["id"]}).to_list(500)
        scores = [a["percentage"] for a in attempts if "percentage" in a]
        projects = await db.projects.count_documents({"owner_id": s["id"]})
        last = max([r["updated_at"] for r in recs], default=None)
        avg = round(sum(scores) / len(scores)) if scores else 0
        rows.append({"student_id": s["id"], "name": s["name"], "lessons_completed": len(recs),
                     "avg_quiz_score": avg, "projects": projects, "last_active": last,
                     "needs_attention": avg < 50 or len(recs) == 0})
    all_scores = [r["avg_quiz_score"] for r in rows if r["avg_quiz_score"]]
    return {"total_students": len(students),
            "active_students": len([r for r in rows if r["lessons_completed"] > 0]),
            "lessons_completed": sum(r["lessons_completed"] for r in rows),
            "avg_quiz_score": round(sum(all_scores) / len(all_scores)) if all_scores else 0,
            "projects_completed": sum(r["projects"] for r in rows),
            "needs_attention": len([r for r in rows if r["needs_attention"]]),
            "students": rows,
            "batches": [clean(b) for b in batches]}


@router.get("/student")
async def student_analytics(user: dict = Depends(get_current_user)):
    return {"ok": True}
