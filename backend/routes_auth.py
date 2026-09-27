"""Authentication routes."""
import os
import secrets
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, HTTPException, Response, Request, Depends
from core import (db, hash_password, verify_password, create_access_token,
                  create_refresh_token, get_current_user, clean, now_iso, new_id,
                  get_jwt_secret, JWT_ALGORITHM, ROLES)
from models import (LoginRequest, RegisterRequest, ForgotPasswordRequest, ResetPasswordRequest)
import jwt

router = APIRouter(prefix="/auth", tags=["auth"])


def _set_cookies(response: Response, access: str, refresh: str):
    response.set_cookie("access_token", access, httponly=True, secure=True, samesite="none", max_age=43200, path="/")
    response.set_cookie("refresh_token", refresh, httponly=True, secure=True, samesite="none", max_age=2592000, path="/")


async def _issue(user: dict, response: Response):
    access = create_access_token(user["id"], user["email"], user["role"])
    refresh = create_refresh_token(user["id"])
    _set_cookies(response, access, refresh)
    return {"user": clean(dict(user)), "access_token": access, "refresh_token": refresh}


@router.post("/register")
async def register(body: RegisterRequest, response: Response):
    email = body.email.lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    if body.role not in ROLES:
        raise HTTPException(status_code=400, detail="Invalid role")
    uid = new_id()
    user = {
        "id": uid, "name": body.name, "email": email,
        "password_hash": hash_password(body.password), "role": body.role,
        "center_id": body.center_id, "status": "active", "avatar": "",
        "created_at": now_iso(), "updated_at": now_iso(),
    }
    await db.users.insert_one(user)
    return await _issue(user, response)


@router.post("/login")
async def login(body: LoginRequest, response: Response, request: Request):
    email = body.email.lower()
    ident = f"{request.client.host}:{email}"
    attempt = await db.login_attempts.find_one({"identifier": ident})
    if attempt and attempt.get("count", 0) >= 5:
        locked_until = attempt.get("locked_until")
        if locked_until and datetime.fromisoformat(locked_until) > datetime.now(timezone.utc):
            raise HTTPException(status_code=429, detail="Too many attempts. Try again in a few minutes.")
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(body.password, user["password_hash"]):
        new_count = (attempt.get("count", 0) + 1) if attempt else 1
        await db.login_attempts.update_one(
            {"identifier": ident},
            {"$set": {"identifier": ident, "count": new_count,
                      "locked_until": (datetime.now(timezone.utc) + timedelta(minutes=15)).isoformat()}},
            upsert=True)
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if user.get("status") == "suspended":
        raise HTTPException(status_code=403, detail="Account suspended. Contact your center admin.")
    await db.login_attempts.delete_one({"identifier": ident})
    return await _issue(user, response)


@router.post("/logout")
async def logout(response: Response, user: dict = Depends(get_current_user)):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"ok": True}


@router.get("/me")
async def me(user: dict = Depends(get_current_user)):
    return user


@router.post("/refresh")
async def refresh(request: Request, response: Response):
    token = request.cookies.get("refresh_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    if not token:
        raise HTTPException(status_code=401, detail="No refresh token")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    user = await db.users.find_one({"id": payload["sub"]})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    access = create_access_token(user["id"], user["email"], user["role"])
    response.set_cookie("access_token", access, httponly=True, secure=True, samesite="none", max_age=43200, path="/")
    return {"access_token": access, "user": clean(dict(user))}


@router.post("/forgot-password")
async def forgot_password(body: ForgotPasswordRequest):
    user = await db.users.find_one({"email": body.email.lower()})
    if user:
        token = secrets.token_urlsafe(32)
        await db.password_reset_tokens.insert_one({
            "id": new_id(), "user_id": user["id"], "token": token, "used": False,
            "expires_at": datetime.now(timezone.utc) + timedelta(hours=1),
        })
        print(f"[PASSWORD RESET] Link for {user['email']}: /reset-password?token={token}")
    return {"message": "If that email exists, a reset link has been generated."}


@router.post("/reset-password")
async def reset_password(body: ResetPasswordRequest):
    rec = await db.password_reset_tokens.find_one({"token": body.token, "used": False})
    if not rec:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    await db.users.update_one({"id": rec["user_id"]}, {"$set": {"password_hash": hash_password(body.new_password), "updated_at": now_iso()}})
    await db.password_reset_tokens.update_one({"id": rec["id"]}, {"$set": {"used": True}})
    return {"message": "Password reset successful"}
