from pydantic import BaseModel
from datetime import datetime

class EventResponse(BaseModel):
    event_id: str
    begin_at: datetime
    end_at: datetime
    place: str
    title: str
    capacity: int
