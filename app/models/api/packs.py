# app/api/packs.py

from pydantic import BaseModel , constr
from typing import Optional

from .api_base import MyBaseModel
class PackResponse(MyBaseModel):
    pack_id: constr(min_length=36, max_length=36)
    name: str
    activity_number: int
    annual_collaborator_price: int
    bonus_consultation_price: int
    default_consultation_number: int
    staff_size: int
    chatbot_messages_number: Optional[int]
   
