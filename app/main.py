from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.company import router as company_router
from routes.auth import router as auth_router
from routes.checkout import router as checkout_router
from fastapi.staticfiles import StaticFiles
from routes.stats_client import router as client_stats_router
from routes.stats_prestations import router as prestations_stats_router
from routes.company_inscription_route import router as company_inscription_router
from routes.ticket import router as ticket_router
from fastapi.staticfiles import StaticFiles
from routes.chatbot import router as chatbot_router
import os
from dotenv import load_dotenv 
import uvicorn
import logging
from uvicorn.middleware.proxy_headers import ProxyHeadersMiddleware
from routes.forum import router as forum_router

from routes.contractor import router as contractor_router
from routes.collaborator import router as collaborator_router
from routes.admin import router as admin_router
import stripe

logging.basicConfig(level=logging.DEBUG)

stripe.api_key = os.environ.get("STRIPE_SECRET_KEY")

app = FastAPI(debug=True)

app.add_middleware(ProxyHeadersMiddleware, trusted_hosts="*")

allowed_origins = [
    f"https://{os.environ.get('DOMAIN')}",
    f"https://www.{os.environ.get('DOMAIN')}",
    "*"
]


app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*", "token"],
)



@app.get("/")
def home():
    return {"msg": "API OK"}


os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
app.include_router(chatbot_router, prefix="/chatbot")
app.include_router(company_inscription_router , prefix="/company_inscription_route", tags=["company_inscription_route"])
app.include_router(company_router, prefix="/company", tags=["company"])
app.include_router(admin_router, prefix="/admin", tags=["admin"])
app.include_router(forum_router, prefix="/forum")
app.include_router(ticket_router, prefix="/ticket", tags=["ticket"])
app.include_router(auth_router, prefix="/auth", tags=["auth"])
app.include_router(contractor_router, prefix="/contractor", tags=["contractor"])
app.include_router(collaborator_router, prefix="/collaborator", tags=["collaborator"])
app.include_router(checkout_router, prefix="/checkout", tags=["checkout"])
app.include_router(client_stats_router, prefix="/stats_client", tags=["stats_client"])
app.include_router(prestations_stats_router, prefix="/stats_prestations", tags=["stats_prestations"])

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
