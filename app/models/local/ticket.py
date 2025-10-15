from pydantic import BaseModel

class TicketCreateSchema(BaseModel):
    title: str
    text: str
