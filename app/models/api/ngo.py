from pydantic import BaseModel
from datetime import datetime

class NgoAdminResponse(BaseModel):
    ngo_id: str
    name: str
    registration_number: str
    registration_date: datetime
    address: str
    country: str
    type: str
    presentation: str
    website: str
    phone: str


class NgoCreate(BaseModel):
    name: str
    registration_number: str
    address: str
    country: str
    type: str
    presentation: str
    website: str
    phone: str


class NgoResponse(BaseModel):
    ngo_id: str
    name: str
    registration_date: datetime
    address: str
    country: str
    type: str
    presentation: str
    website: str
    phone: str

    class Config:
        orm_mode = True    