# schemas/users_schema.py
from pydantic import BaseModel, ConfigDict, EmailStr, constr, field_validator, Field , model_validator
from datetime import datetime, date
from typing import Optional, Literal, List



class PeriodeSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    beginning: datetime
    end: datetime