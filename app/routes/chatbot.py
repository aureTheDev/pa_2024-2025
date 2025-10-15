# routes/chatbot.py
import os
import httpx
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from dotenv import load_dotenv
from queries.ChatbotUsageQuery import ChatbotQuery

load_dotenv()
router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    collaborator_id: str

@router.post("/chat")
async def chat(req: ChatRequest):
    query = ChatbotQuery()

    limit = query.get_message_limit(req.collaborator_id)
    if limit is None:
        raise HTTPException(status_code=400, detail="Abonnement introuvable.")

    used = query.get_usage_count_this_month(req.collaborator_id)
    if used >= limit:
        raise HTTPException(status_code=403, detail="Quota mensuel atteint.")

    query.log_question(req.collaborator_id, req.message)

    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {os.getenv('OPENROUTER_API_KEY')}",
                "Content-Type": "application/json",
                "HTTP-Referer": "https://care-connect.ovh",
                "X-Title": "BusinessCareBot"
            },
            json={
                "model": "openai/gpt-3.5-turbo",
                "messages": [{"role": "user", "content": req.message}]
            }
        )

    if response.status_code != 200:
        raise HTTPException(status_code=500, detail="Erreur API OpenRouter")

    data = response.json()
    return {"response": data["choices"][0]["message"]["content"]}