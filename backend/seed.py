"""Idempotent seeding of admin, demo center, users and curriculum content."""
import os
from core import db, hash_password, verify_password, now_iso, new_id, ROOT_DIR
from seed_content import COURSES, QUIZZES, DEMO_STUDENTS

MEMORY = ROOT_DIR.parent / "memory"


async def ensure_indexes():
    await db.users.create_index("email", unique=True)
    await db.users.create_index("role")
    await db.users.create_index("center_id")
    await db.courses.create_index("slug", unique=True)
    await db.modules.create_index("course_id")
    await db.lessons.create_index("module_id")
    await db.student_progress.create_index([("student_id", 1), ("course_id", 1)])
    await db.quiz_attempts.create_index("student_id")
    await db.projects.create_index("owner_id")
    await db.sync_queue.create_index("user_id")
    await db.password_reset_tokens.create_index("expires_at", expireAfterSeconds=0)


async def _upsert_user(name, email, password, role, center_id=None):
    existing = await db.users.find_one({"email": email})
    if existing:
        return existing["id"]
    uid = new_id()
    await db.users.insert_one({
        "id": uid, "name": name, "email": email.lower(),
        "password_hash": hash_password(password), "role": role,
        "center_id": center_id, "status": "active", "avatar": "",
        "created_at": now_iso(), "updated_at": now_iso(),
    })
    return uid


async def seed_content():
    course_ids = {}
    for c in COURSES:
        existing = await db.courses.find_one({"slug": c["slug"]})
        if existing:
            course_ids[c["slug"]] = existing["id"]
            continue
        cid = new_id()
        course_ids[c["slug"]] = cid
        await db.courses.insert_one({
            "id": cid, "slug": c["slug"], "title": c["title"], "description": c["description"],
            "age_group": c["age_group"], "difficulty": c["difficulty"], "duration": c["duration"],
            "category": c["category"], "thumbnail": c["thumbnail"], "status": "published",
            "created_at": now_iso(), "updated_at": now_iso(),
        })
        for mi, m in enumerate(c["modules"]):
            mid = new_id()
            await db.modules.insert_one({
                "id": mid, "course_id": cid, "title": m["title"],
                "description": m.get("description", ""), "order": mi,
            })
            for li, les in enumerate(m["lessons"]):
                await db.lessons.insert_one({
                    "id": new_id(), "module_id": mid, "course_id": cid, "title": les["title"],
                    "description": les.get("description", ""), "content": les["content"],
                    "estimated_time": les.get("estimated_time", "20 min"),
                    "difficulty": "beginner", "order": li,
                })
        if c["slug"] in QUIZZES:
            q = QUIZZES[c["slug"]]
            await db.quizzes.insert_one({
                "id": new_id(), "course_id": cid, "title": q["title"],
                "questions": [{**qq, "id": new_id()} for qq in q["questions"]],
                "created_at": now_iso(),
            })
    return course_ids


async def run_seed():
    await ensure_indexes()

    # Super admin from env
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@brainbonds.com")
    admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")
    existing_admin = await db.users.find_one({"email": admin_email})
    if not existing_admin:
        await _upsert_user("Super Admin", admin_email, admin_password, "super_admin")
    elif not verify_password(admin_password, existing_admin["password_hash"]):
        await db.users.update_one({"email": admin_email}, {"$set": {"password_hash": hash_password(admin_password)}})

    # Demo center
    center = await db.centers.find_one({"name": "Brain Bonds Learning Center"})
    if not center:
        center_id = new_id()
        await db.centers.insert_one({
            "id": center_id, "name": "Brain Bonds Learning Center", "city": "Chennai",
            "address": "12 Learning Street", "contact_email": "center@brainbonds.com",
            "phone": "+91 90000 00000", "status": "active",
            "created_at": now_iso(), "updated_at": now_iso(),
        })
    else:
        center_id = center["id"]

    # License for center
    lic = await db.licenses.find_one({"center_id": center_id})
    if not lic:
        from datetime import datetime, timezone, timedelta
        await db.licenses.insert_one({
            "id": new_id(), "center_id": center_id, "plan": "premium",
            "activation_date": now_iso(),
            "expiry_date": (datetime.now(timezone.utc) + timedelta(days=365)).isoformat(),
            "max_students": 100, "status": "active",
            "key": "BB-" + new_id().split("-")[0].upper(),
            "created_at": now_iso(), "updated_at": now_iso(),
        })

    # Content
    course_ids = await seed_content()

    # Center admin + trainer + students
    await _upsert_user("Center Admin", "center@brainbonds.com", "Center@123", "center_admin", center_id)
    trainer_id = await _upsert_user("Demo Trainer", "trainer@brainbonds.com", "Trainer@123", "trainer", center_id)
    student_ids = []
    for name in DEMO_STUDENTS:
        sid = await _upsert_user(name, f"{name.lower()}@brainbonds.com", "Student@123", "student", center_id)
        student_ids.append(sid)

    # Batch
    batch = await db.batches.find_one({"name": "Brain Bonds Batch A"})
    if not batch:
        await db.batches.insert_one({
            "id": new_id(), "center_id": center_id, "name": "Brain Bonds Batch A",
            "trainer_id": trainer_id, "course_ids": list(course_ids.values()),
            "student_ids": student_ids, "schedule": "Mon/Wed/Fri 4-6 PM",
            "start_date": "2026-01-06", "end_date": "2026-06-30", "status": "active",
            "created_at": now_iso(), "updated_at": now_iso(),
        })

    # Seed some progress for first student so dashboards aren't empty
    first = student_ids[0]
    if not await db.student_progress.find_one({"student_id": first}):
        coding = course_ids.get("coding-fundamentals")
        lessons = await db.lessons.find({"course_id": coding}).to_list(100)
        for i, les in enumerate(lessons[:3]):
            await db.student_progress.insert_one({
                "id": new_id(), "student_id": first, "course_id": coding,
                "lesson_id": les["id"], "status": "completed",
                "completion_percentage": 100, "score": 90,
                "updated_at": now_iso(),
            })
        await db.achievements.insert_one({
            "id": new_id(), "student_id": first, "key": "first-steps",
            "title": "First Steps", "description": "Completed your first lesson",
            "icon": "sparkles", "earned_at": now_iso(),
        })

    await write_credentials(admin_email, admin_password)


async def write_credentials(admin_email, admin_password):
    MEMORY.mkdir(exist_ok=True)
    content = f"""# Brain Bonds \u2014 Test Credentials

All demo passwords below are seeded and idempotent.

| Role | Email | Password |
|------|-------|----------|
| Super Admin | {admin_email} | {admin_password} |
| Center Admin | center@brainbonds.com | Center@123 |
| Trainer | trainer@brainbonds.com | Trainer@123 |
| Student (Aarav) | aarav@brainbonds.com | Student@123 |
| Student (Ananya) | ananya@brainbonds.com | Student@123 |
| Student (Rahul) | rahul@brainbonds.com | Student@123 |
| Student (Priya) | priya@brainbonds.com | Student@123 |

## Auth endpoints
- POST /api/auth/login
- POST /api/auth/register
- POST /api/auth/refresh
- GET  /api/auth/me
- POST /api/auth/logout
- POST /api/auth/forgot-password
- POST /api/auth/reset-password
"""
    (MEMORY / "test_credentials.md").write_text(content)
