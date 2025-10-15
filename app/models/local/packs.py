# app/local/packs.py

from pydantic import constr, BaseModel, ConfigDict , Field
from typing import Optional
from datetime import datetime
from uuid import uuid4

class PackSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    pack_id: constr(min_length=36, max_length=36)
    name: str
    creation_date: datetime
    activity_number: int
    annual_collaborator_price: int
    bonus_consultation_price: int
    default_consultation_number: int
    staff_size: int
    chatbot_messages_number: Optional[int]


class PackCreate(BaseModel):
    name: str
    activity_number: int
    annual_collaborator_price: int
    bonus_consultation_price: int
    default_consultation_number: int
    staff_size: int
    chatbot_messages_number: Optional[int]
  
