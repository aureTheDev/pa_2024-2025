from pydantic import BaseModel
from datetime import datetime

class EventCreate(BaseModel):
    title: str
    begin_at: datetime
    end_at: datetime
    place: str
    capacity: int

class EventResponse(EventCreate):
    event_id: str
    ngo_id: str
