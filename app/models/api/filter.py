from datetime import date, datetime
from typing import Optional, Literal
from pydantic import BaseModel, EmailStr, constr
from .api_base import MyBaseModel

class MedicalContractorFilter(MyBaseModel):
    intervention: Optional[Literal["incall", "outcall", "both"]] = None
    service: Optional[str] = None