from pydantic import BaseModel
from uuid import UUID
from datetime import datetime

class TicketResponse(BaseModel):
    ticket_id: UUID
    title: str
    text: str
    open_date: datetime
    user_id: UUID

class TicketAdminResponse(BaseModel):
    ticket_id: str
    title: str
    text: str
    open_date: datetime
    close_date: datetime | None
    user_firstname: str
    user_lastname: str
    user_role: str
    status: str
