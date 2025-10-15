from fastapi import APIRouter, HTTPException, Header, Body
from queries.ticket_queries import TicketQuery
from service.ticket import TicketService
from service.user import User  
from queries.user_queries import UserQuery
from models.local.ticket import TicketCreateSchema
from models.api.ticket import TicketResponse
from queries.admin_queries import AdminQuery
from service.admin import AdminTicketService 

router = APIRouter()


@router.post("/tickets")
def create_ticket(data: TicketCreateSchema, token: str = Header(...)):
    user = User(UserQuery(), token)
    service = TicketService(TicketQuery())
    return service.create_ticket_with_message(data.title, data.text, user.user_id)

@router.get("/myTickets")
def get_user_tickets(token: str = Header(...)):
    user = User(UserQuery(), token)
    service = TicketService(TicketQuery())
    return service.get_tickets_by_user(user.user_id)


@router.post("/{ticket_id}/reply")
def user_reply_to_ticket(ticket_id: str, data: dict = Body(...), token: str = Header(...)):
    user = User(UserQuery(), token)
    text = data.get("text")
    if not text:
        raise HTTPException(400, detail="Message requis")

    service = TicketService(TicketQuery())
    success = service.reply_to_ticket(ticket_id, text, user.user_id)

    if not success:
        raise HTTPException(404, detail="Ticket introuvable")

    return {"message": "Réponse envoyée"}


@router.get("/{ticket_id}/messages")
def get_ticket_messages(ticket_id: str, token: str = Header(...)):
    user = User(UserQuery(), token)
    service = TicketService(TicketQuery())
    result = service.get_ticket_with_messages(ticket_id)
    if not result:
        raise HTTPException(404, detail="Ticket introuvable")
    return result
