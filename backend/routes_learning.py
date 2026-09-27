"""Learning routes: courses, modules, lessons, progress, projects, quizzes, achievements, labs meta."""
from fastapi import APIRouter, HTTPException, Depends
from core import db, require_roles, get_current_user, clean, now_iso, new_id
from models import (CourseCreate, ModuleCreate, LessonCreate, ProgressUpdate,
                    ProjectCreate, ProjectUpdate, QuizAttemptSubmit)
from seed_content import ROBOTICS_CHALLENGES, GAME_TEMPLATES

router = APIRouter(tags=["learning"])


# ---------------- Courses ----------------
@router.get("/courses")
async def list_courses(category: str = None, user: dict = Depends(get_current_user)):
    q = {}
    if category:
        q["category"] = category
    courses = await db.courses.find(q).to_list(500)
    for c in courses:
        c["module_count"] = await db.modules.count_documents({"course_id": c["id"]})
        c["lesson_count"] = await db.lessons.count_documents({"course_id": c["id"]})
    return [clean(c) for c in courses]


@router.post("/courses")
async def create_course(body: CourseCreate, user: dict = Depends(require_roles("super_admin"))):
    slug = body.title.lower().replace(" ", "-")[:60] + "-" + new_id().split("-")[0]
    doc = {"id": new_id(), "slug": slug, **body.model_dump(), "status": "published",
           "created_at": now_iso(), "updated_at": now_iso()}
    await db.courses.insert_one(doc)
    return clean(doc)


@router.get("/courses/{course_id}")
async def get_course(course_id: str, user: dict = Depends(get_current_user)):
    course = await db.courses.find_one({"id": course_id}, {"_id": 0})
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    modules = await db.modules.find({"course_id": course_id}, {"_id": 0}).sort("order", 1).to_list(200)
    for m in modules:
        lessons = await db.lessons.find({"module_id": m["id"]}, {"_id": 0}).sort("order", 1).to_list(200)
        m["lessons"] = lessons
    course["modules"] = modules
    quiz = await db.quizzes.find_one({"course_id": course_id}, {"_id": 0})
    if quiz:
        # hide answers in course payload
        quiz["questions"] = [{k: v for k, v in q.items() if k not in ("answer", "explanation")} for q in quiz["questions"]]
    course["quiz"] = quiz
    return course


@router.post("/modules")
async def create_module(body: ModuleCreate, user: dict = Depends(require_roles("super_admin"))):
    doc = {"id": new_id(), **body.model_dump()}
    await db.modules.insert_one(doc)
    return clean(doc)


@router.post("/lessons")
async def create_lesson(body: LessonCreate, user: dict = Depends(require_roles("super_admin"))):
    module = await db.modules.find_one({"id": body.module_id})
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    doc = {"id": new_id(), "course_id": module["course_id"], **body.model_dump()}
    await db.lessons.insert_one(doc)
    return clean(doc)


@router.get("/lessons/{lesson_id}")
async def get_lesson(lesson_id: str, user: dict = Depends(get_current_user)):
    lesson = await db.lessons.find_one({"id": lesson_id})
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    return clean(lesson)


# ---------------- Progress ----------------
@router.post("/progress")
async def update_progress(body: ProgressUpdate, user: dict = Depends(get_current_user)):
    student_id = user["id"]
    key = {"student_id": student_id, "course_id": body.course_id, "lesson_id": body.lesson_id}
    doc = {**key, "status": body.status, "completion_percentage": body.completion_percentage,
           "score": body.score, "updated_at": now_iso()}
    existing = await db.student_progress.find_one(key)
    if existing:
        await db.student_progress.update_one(key, {"$set": doc})
    else:
        doc["id"] = new_id()
        await db.student_progress.insert_one(doc)
    # award course-completion certificate & achievement
    await _check_course_completion(student_id, body.course_id)
    return {"ok": True}


async def _check_course_completion(student_id, course_id):
    total = await db.lessons.count_documents({"course_id": course_id})
    if total == 0:
        return
    done = await db.student_progress.count_documents({"student_id": student_id, "course_id": course_id, "status": "completed", "lesson_id": {"$ne": None}})
    if done >= total:
        course = await db.courses.find_one({"id": course_id})
        if course and not await db.certificates.find_one({"student_id": student_id, "course_id": course_id}):
            await db.certificates.insert_one({
                "id": new_id(), "student_id": student_id, "course_id": course_id,
                "title": f"{course['title']} Certificate", "issued_at": now_iso(),
            })
            await db.achievements.insert_one({
                "id": new_id(), "student_id": student_id, "key": f"course-{course_id}",
                "title": f"{course['title']} Master", "description": "Completed the whole course!",
                "icon": "award", "earned_at": now_iso(),
            })


@router.get("/students/{student_id}/progress")
async def student_progress(student_id: str, user: dict = Depends(get_current_user)):
    if user["role"] == "student" and user["id"] != student_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    recs = await db.student_progress.find({"student_id": student_id}).to_list(2000)
    attempts = await db.quiz_attempts.find({"student_id": student_id}).to_list(500)
    projects = await db.projects.count_documents({"owner_id": student_id})
    courses = await db.courses.find({}).to_list(200)
    per_course = []
    for c in courses:
        total = await db.lessons.count_documents({"course_id": c["id"]})
        done = len([r for r in recs if r["course_id"] == c["id"] and r.get("lesson_id") and r["status"] == "completed"])
        if done == 0 and total > 0:
            continue
        per_course.append({"course_id": c["id"], "title": c["title"], "category": c["category"],
                           "total_lessons": total, "completed_lessons": done,
                           "percentage": round(done / total * 100) if total else 0})
    lessons_completed = len([r for r in recs if r.get("lesson_id") and r["status"] == "completed"])
    quiz_scores = [round(a["score"] / a["total"] * 100) for a in attempts if a.get("total")]
    avg_quiz = round(sum(quiz_scores) / len(quiz_scores)) if quiz_scores else 0
    all_total = await db.lessons.count_documents({})
    overall = round(lessons_completed / all_total * 100) if all_total else 0
    return {
        "overall_percentage": overall,
        "lessons_completed": lessons_completed,
        "projects_completed": projects,
        "avg_quiz_score": avg_quiz,
        "courses": per_course,
        "quiz_attempts": len(attempts),
    }


# ---------------- Projects ----------------
@router.get("/projects")
async def list_projects(type: str = None, student_id: str = None, user: dict = Depends(get_current_user)):
    owner = user["id"]
    if student_id and user["role"] in ("trainer", "center_admin", "super_admin"):
        owner = student_id
    q = {"owner_id": owner}
    if type:
        q["type"] = type
    projects = await db.projects.find(q).sort("updated_at", -1).to_list(500)
    return [clean(p) for p in projects]


@router.post("/projects")
async def create_project(body: ProjectCreate, user: dict = Depends(get_current_user)):
    pid = body.id or new_id()
    existing = await db.projects.find_one({"id": pid, "owner_id": user["id"]})
    doc = {
        "id": pid, "owner_id": user["id"], "name": body.name, "type": body.type,
        "data": body.data, "course_id": body.course_id, "thumbnail": body.thumbnail,
        "status": "saved", "updated_at": now_iso(),
    }
    if existing:
        await db.projects.update_one({"id": pid, "owner_id": user["id"]}, {"$set": doc})
    else:
        doc["created_at"] = now_iso()
        await db.projects.insert_one(doc)
    return clean(doc)


@router.get("/projects/{project_id}")
async def get_project(project_id: str, user: dict = Depends(get_current_user)):
    p = await db.projects.find_one({"id": project_id})
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")
    if user["role"] == "student" and p["owner_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Forbidden")
    return clean(p)


@router.put("/projects/{project_id}")
async def update_project(project_id: str, body: ProjectUpdate, user: dict = Depends(get_current_user)):
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    updates["updated_at"] = now_iso()
    await db.projects.update_one({"id": project_id, "owner_id": user["id"]}, {"$set": updates})
    return clean(await db.projects.find_one({"id": project_id}))


@router.post("/projects/{project_id}/duplicate")
async def duplicate_project(project_id: str, user: dict = Depends(get_current_user)):
    p = await db.projects.find_one({"id": project_id, "owner_id": user["id"]})
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")
    dup = {**p, "id": new_id(), "name": p["name"] + " (Copy)", "created_at": now_iso(), "updated_at": now_iso()}
    dup.pop("_id", None)
    await db.projects.insert_one(dup)
    return clean(dup)


@router.delete("/projects/{project_id}")
async def delete_project(project_id: str, user: dict = Depends(get_current_user)):
    await db.projects.delete_one({"id": project_id, "owner_id": user["id"]})
    return {"ok": True}


# ---------------- Quizzes ----------------
@router.get("/quizzes")
async def list_quizzes(course_id: str = None, user: dict = Depends(get_current_user)):
    q = {"course_id": course_id} if course_id else {}
    quizzes = await db.quizzes.find(q).to_list(200)
    out = []
    for qz in quizzes:
        clean(qz)
        qz["question_count"] = len(qz.get("questions", []))
        qz["questions"] = [{k: v for k, v in question.items() if k not in ("answer", "explanation")} for question in qz["questions"]]
        out.append(qz)
    return out


@router.get("/quizzes/{quiz_id}")
async def get_quiz(quiz_id: str, user: dict = Depends(get_current_user)):
    qz = await db.quizzes.find_one({"id": quiz_id}, {"_id": 0})
    if not qz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    qz["questions"] = [{k: v for k, v in question.items() if k not in ("answer", "explanation")} for question in qz["questions"]]
    return qz


@router.post("/quizzes/attempt")
async def submit_quiz(body: QuizAttemptSubmit, user: dict = Depends(get_current_user)):
    qz = await db.quizzes.find_one({"id": body.quiz_id})
    if not qz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    questions = qz["questions"]
    correct = 0
    review = []
    for question in questions:
        given = body.answers.get(question["id"])
        is_correct = str(given) == str(question["answer"])
        if is_correct:
            correct += 1
        review.append({"question_id": question["id"], "text": question["text"], "given": given,
                       "answer": question["answer"], "correct": is_correct, "explanation": question.get("explanation", "")})
    total = len(questions)
    attempt = {
        "id": new_id(), "student_id": user["id"], "quiz_id": body.quiz_id,
        "course_id": qz["course_id"], "score": correct, "total": total,
        "percentage": round(correct / total * 100) if total else 0,
        "answers": body.answers, "time_taken": body.time_taken,
        "completed": True, "created_at": now_iso(),
    }
    await db.quiz_attempts.insert_one(attempt)
    if total and correct / total >= 0.6 and not await db.achievements.find_one({"student_id": user["id"], "key": "quiz-ace"}):
        await db.achievements.insert_one({"id": new_id(), "student_id": user["id"], "key": "quiz-ace",
                                          "title": "Quiz Ace", "description": "Passed a quiz with 60%+",
                                          "icon": "star", "earned_at": now_iso()})
    clean(attempt)
    attempt["review"] = review
    return clean(attempt)


@router.get("/quiz-attempts")
async def quiz_attempts(student_id: str = None, user: dict = Depends(get_current_user)):
    sid = student_id or user["id"]
    if user["role"] == "student" and sid != user["id"]:
        raise HTTPException(status_code=403, detail="Forbidden")
    attempts = await db.quiz_attempts.find({"student_id": sid}).sort("created_at", -1).to_list(500)
    return [clean(a) for a in attempts]


# ---------------- Achievements & Certificates ----------------
@router.get("/achievements")
async def achievements(student_id: str = None, user: dict = Depends(get_current_user)):
    sid = student_id or user["id"]
    ach = await db.achievements.find({"student_id": sid}).to_list(200)
    certs = await db.certificates.find({"student_id": sid}).to_list(200)
    course_map = {c["id"]: c["title"] for c in await db.courses.find({}).to_list(200)}
    for cc in certs:
        cc["course_title"] = course_map.get(cc.get("course_id"), "")
    return {"achievements": [clean(a) for a in ach], "certificates": [clean(cc) for cc in certs]}


# ---------------- Labs meta ----------------
@router.get("/labs/robotics-challenges")
async def robotics_challenges(user: dict = Depends(get_current_user)):
    return ROBOTICS_CHALLENGES


@router.get("/labs/game-templates")
async def game_templates(user: dict = Depends(get_current_user)):
    return GAME_TEMPLATES
