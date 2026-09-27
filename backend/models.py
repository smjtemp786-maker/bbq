"""Pydantic request/response schemas."""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Any, Dict


# ---------- Auth ----------
class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str = "student"
    center_id: Optional[str] = None


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


# ---------- Centers / Licenses ----------
class CenterCreate(BaseModel):
    name: str
    city: Optional[str] = ""
    address: Optional[str] = ""
    contact_email: Optional[str] = ""
    phone: Optional[str] = ""


class CenterUpdate(BaseModel):
    name: Optional[str] = None
    city: Optional[str] = None
    address: Optional[str] = None
    contact_email: Optional[str] = None
    phone: Optional[str] = None
    status: Optional[str] = None


class LicenseCreate(BaseModel):
    center_id: str
    plan: str = "standard"
    max_students: int = 50
    valid_months: int = 12


# ---------- Users (trainers / students) ----------
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str
    center_id: Optional[str] = None


class UserUpdate(BaseModel):
    name: Optional[str] = None
    status: Optional[str] = None
    center_id: Optional[str] = None


# ---------- Batches ----------
class BatchCreate(BaseModel):
    name: str
    trainer_id: Optional[str] = None
    course_ids: List[str] = []
    schedule: Optional[str] = ""
    start_date: Optional[str] = ""
    end_date: Optional[str] = ""


class BatchUpdate(BaseModel):
    name: Optional[str] = None
    trainer_id: Optional[str] = None
    course_ids: Optional[List[str]] = None
    student_ids: Optional[List[str]] = None
    schedule: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    status: Optional[str] = None


class EnrollRequest(BaseModel):
    student_ids: List[str]


# ---------- Courses / Curriculum ----------
class CourseCreate(BaseModel):
    title: str
    description: str = ""
    age_group: str = "8-14"
    difficulty: str = "beginner"
    duration: str = ""
    thumbnail: str = ""
    category: str = "coding"


class ModuleCreate(BaseModel):
    course_id: str
    title: str
    description: str = ""
    order: int = 0


class LessonCreate(BaseModel):
    module_id: str
    title: str
    description: str = ""
    content: str = ""
    estimated_time: str = "20 min"
    difficulty: str = "beginner"
    order: int = 0


# ---------- Progress ----------
class ProgressUpdate(BaseModel):
    course_id: str
    lesson_id: Optional[str] = None
    status: str = "in_progress"  # started | in_progress | completed
    completion_percentage: int = 0
    score: Optional[int] = None


# ---------- Projects ----------
class ProjectCreate(BaseModel):
    id: Optional[str] = None
    name: str
    type: str = "coding"  # coding | game | robotics | ai
    data: Dict[str, Any] = {}
    course_id: Optional[str] = None
    thumbnail: Optional[str] = ""


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    data: Optional[Dict[str, Any]] = None
    thumbnail: Optional[str] = None
    status: Optional[str] = None


# ---------- Quizzes ----------
class QuizAttemptSubmit(BaseModel):
    quiz_id: str
    answers: Dict[str, Any]
    time_taken: int = 0


# ---------- Sync ----------
class SyncPushRequest(BaseModel):
    items: List[Dict[str, Any]]


class SyncPullRequest(BaseModel):
    since: Optional[str] = None


# ---------- AI Lab ----------
class AiRequest(BaseModel):
    activity: str = "chat"  # chat | hint | explain | grade
    prompt: str
    context: Optional[str] = ""
