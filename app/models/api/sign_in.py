from datetime import date, datetime
import re
from pydantic import EmailStr, BaseModel, constr, Field, validator
from typing import Optional, Literal
from .api_base import MyBaseModel
from service.logging import logging


class SignInRequest(MyBaseModel):
    firstname: constr(min_length=1, max_length=50)
    lastname: constr(min_length=1, max_length=50)
    dob: date
    email: EmailStr
    password: constr(max_length=128)
    role: Optional[str]
    country: constr(max_length=255)
    city: constr(max_length=255)
    street: constr(max_length=255)
    pc: constr(max_length=10)
    phone: constr(max_length=51)

    @validator("password")
    def check_password_length(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("Le mot de passe doit comporter au moins 6 caractères")
        return v

    @validator("street")
    def validate_street(cls, value: str) -> str:
        if not re.match(r"^\d+\s+\D.*", value):
            raise ValueError("L'adresse doit commencer par un ou plusieurs chiffres, un espace et du texte")
        return value

    @validator("pc")
    def validate_pc(cls, value: str) -> str:
        if not re.match(r"^\d{5}$", value):
            raise ValueError("Le code postal doit contenir exactement 5 chiffres")
        return value

    @validator("phone")
    def validate_phone(cls, value: str) -> str:
        if not re.match(r"^\+33\d{9}$", value):
            raise ValueError("Le numéro de téléphone doit être au format +33 suivi de 9 chiffres")
        return value

class ContractorSignInRequest(SignInRequest):
    registration_number: constr(max_length=50)
    registration_date: date
    service: constr(max_length=255)
    service_price: int = Field(..., ge=1)
    website: Optional[constr(max_length=255)] = None
    type: Literal["Medical", "Healthy"]
    intervention: constr(max_length=50)

    @validator("registration_date")
    def check_registration_date(cls, v: date) -> date:
        if v > date.today():
            raise ValueError("La date d'enregistrement ne peut pas être dans le futur")
        return v


class VerifRequest(MyBaseModel):
    code: constr(min_length=6, max_length=6)