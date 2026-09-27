"""AI Lab routes powered by the Emergent universal LLM key (streaming)."""
import os
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from core import db, get_current_user, now_iso, new_id
from models import AiRequest
from emergentintegrations.llm.chat import LlmChat, UserMessage, TextDelta, StreamDone

router = APIRouter(prefix="/ai", tags=["ai"])

SYSTEM_PROMPTS = {
    "chat": "You are Bondi, a friendly AI tutor for children (ages 8-16) at Brain Bonds. Explain simply, use short sentences, be encouraging, and keep answers under 120 words. Never use complex jargon without explaining it.",
    "hint": "You are a coding hint assistant for kids. Give ONE small, encouraging hint to nudge the student forward. Do NOT give the full solution. Keep it under 60 words.",
    "explain": "You are an AI concepts teacher for children. Explain the concept with a simple real-world analogy a 10-year-old would understand. Keep it under 120 words.",
    "grade": "You are a kind teacher. Given a student's answer, give short constructive feedback and a score out of 10. Be encouraging. Under 100 words.",
}


@router.post("/chat")
async def ai_chat(body: AiRequest, user: dict = Depends(get_current_user)):
    api_key = os.environ["EMERGENT_LLM_KEY"]
    session_id = f"ailab-{user['id']}"
    system = SYSTEM_PROMPTS.get(body.activity, SYSTEM_PROMPTS["chat"])
    chat = LlmChat(api_key=api_key, session_id=session_id, system_message=system).with_model("openai", "gpt-5.4")
    text = body.prompt if not body.context else f"Context: {body.context}\n\nStudent: {body.prompt}"
    user_message = UserMessage(text=text)

    await db.ai_messages.insert_one({"id": new_id(), "user_id": user["id"], "role": "user",
                                     "activity": body.activity, "content": body.prompt, "created_at": now_iso()})

    async def event_generator():
        full = ""
        try:
            async for event in chat.stream_message(user_message):
                if isinstance(event, TextDelta):
                    full += event.content
                    yield event.content
                elif isinstance(event, StreamDone):
                    break
        except Exception as e:  # noqa
            yield f"\n[AI error: {str(e)}]"
        await db.ai_messages.insert_one({"id": new_id(), "user_id": user["id"], "role": "assistant",
                                         "activity": body.activity, "content": full, "created_at": now_iso()})

    return StreamingResponse(event_generator(), media_type="text/plain",
                             headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})


@router.get("/history")
async def ai_history(user: dict = Depends(get_current_user)):
    msgs = await db.ai_messages.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", 1).to_list(200)
    return msgs
