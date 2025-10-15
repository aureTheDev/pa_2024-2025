from pydantic import BaseModel
from datetime import date, datetime
from .api_base import MyBaseModel
from typing import Optional
class CompanyCreatedAPI(MyBaseModel):
    user_id: str
    company_id: str
    name: str
    email: str
    registration_date: date
    inscription_date: datetime


class CompanyResponse(BaseModel):
 # Champs de CompanyTable
    company_id: str
    name: str
    website: Optional[str]
    registration_number: str
    registration_date: date
    industry: str
    revenue: int
    size: int

    # Champs hérités de UserTable
    email: str
    country: str
    city: str
    street: str
    pc: str


class CompanyBase(BaseModel):
    name: str
    website: Optional[str]
    registration_number: str
    registration_date: date
    industry: str
    revenue: int
    size: int


class CompanyUpdate(BaseModel):
    name: Optional[str]
    website: Optional[str]
    industry: Optional[str]
    revenue: Optional[int]
    size: Optional[int]

class CompanyAdminResponse(CompanyBase):
    company_id: str
    firstname: str
    lastname: str
    email: str
    phone: str
    country: str
    city: str
    street: str
    pc: str