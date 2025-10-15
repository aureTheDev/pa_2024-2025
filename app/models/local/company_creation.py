from pydantic import BaseModel, EmailStr, constr
from datetime import date

class CompanyCreateLocal(BaseModel):
    # Responsable
    firstname: constr(min_length=1)
    lastname: constr(min_length=1)
    dob: date
    phone: str
    email: EmailStr
    password: str
    country: str
    city: str
    street: str
    pc: str

    # Société
    name: str
    website: str | None = None
    registration_number: str
    registration_date: date
    industry: str
    revenue: int
    size: int

