from pydantic import constr, BaseModel, ConfigDict
from datetime import datetime

class BillSchema(BaseModel):
    company_id: constr(min_length=36, max_length=36)
    company_subscription_id: constr(min_length=36, max_length=36)
    file: str
    payed: bool
    model_config = ConfigDict(from_attributes=True)

class BillUpdateSchema(BaseModel):
    payed: bool

    model_config = ConfigDict(from_attributes=True)
