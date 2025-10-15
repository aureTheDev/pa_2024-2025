# schemas/users_schema.py
from pydantic import BaseModel, ConfigDict, EmailStr, constr, field_validator, Field , model_validator
from datetime import datetime, date
from typing import Optional, Literal, List



class UserSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    user_id: constr(min_length=36, max_length=36)
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
    password: str



class CompanySchema(UserSchema):
    function: Literal["company"] = "company"
    company_id: constr(min_length=36, max_length=36)
    name: str
    website: Optional[str] = None
    registration_number: str
    registration_date: date
    industry: str
    revenue: int
    size: int
    admin_id: Optional[constr(min_length=36, max_length=36)] = None


class CollaboratorSchema(UserSchema):
    function: Literal["collaborator"] = "collaborator"
    collaborator_id: constr(min_length=36, max_length=36)
    company_id: constr(min_length=36, max_length=36)


class ContractorSchema(UserSchema):
    function: Literal["contractor"] = "contractor"
    contractor_id: constr(min_length=36, max_length=36)
    registration_number: str
    registration_date: date
    contract_file: Optional[str] = None
    sign_date: Optional[date] = None
    service: constr(max_length=255)
    service_price: int = Field(..., ge=1)
    website: Optional[str] = None
    type: Literal["Medical", "Healthy"]
    intervention: constr(max_length=50)
    admin_id: Optional[constr(min_length=36, max_length=36)] = None
    stripe_id: Optional[str] = None


class CollaboratorCreateRequest(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: constr(min_length=36, max_length=36)
    collaborator_id: constr(min_length=36, max_length=36)
    company_id: constr(min_length=36, max_length=36)

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
    function: Literal["collaborator"] = "collaborator"
    password: constr(min_length=64, max_length=128)

    @model_validator(mode="after")
    def check_ids_match(self) -> "CollaboratorCreateRequest":
        if self.user_id != self.collaborator_id:
            raise ValueError("collaborator_id must match user_id")
        return self


class CompanyUpdateSchema(BaseModel):
    name: str
    website: Optional[str] = None
    registration_number: str
    registration_date: date
    industry: str
    revenue: int
    size: int


class UserUpdateSchema(BaseModel):
    firstname: str
    lastname: str
    dob: date
    phone: str
    email: EmailStr
    country: str
    city: str
    street: str
    pc: str


