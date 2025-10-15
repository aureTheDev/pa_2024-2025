from datetime import date, datetime
from typing import Optional, Literal
from pydantic import BaseModel, EmailStr, constr
from .api_base import MyBaseModel

class UserResponse(MyBaseModel):
    firstname: str
    lastname: str
    dob: date
    phone: str
    email: EmailStr
    role: Optional[str] = None
    country: str
    city: str
    street: str
    pc: str
    verified: bool
    inscription_date: datetime
    function: Optional[str] = None



class CompanyResponse(UserResponse):
    company_id: constr(min_length=36, max_length=36)
    name: str
    website: Optional[str]
    registration_number: str
    registration_date: date
    industry: str
    revenue: int
    size: int

class ContractorResponse(UserResponse):
    contractor_id: constr(min_length=36, max_length=36)
    registration_number: str
    registration_date: date
    contract_file: Optional[str]
    sign_date: Optional[date]
    service: str
    service_price: int
    website: Optional[str]
    intervention: str
    type: Literal["Medical", "Helathy"]
    stripe: bool = True

class CollaboratorResponse(UserResponse):
    collaborator_id: constr(min_length=36, max_length=36)
    company_id: constr(min_length=36, max_length=36)


class UpdatePasswordRequest(MyBaseModel):
    password: constr(min_length=5, max_length=128)
    new_password: constr(min_length=5, max_length=128)



class CollaboratorWithCompanyResponse(BaseModel):
    user_id: str
    firstname: str
    lastname: str
    dob: date
    phone: str
    email: str
    role: Optional[str]
    country: str
    city: str
    street: str
    pc: str
    company_name: str    


class CollaboratorWithCompanyResponse(BaseModel):
    user_id: str
    firstname: str
    lastname: str
    dob: date
    phone: str
    email: str
    country: str
    city: str
    street: str
    pc: str
    verified: bool
    inscription_date: datetime
    company_name: str    