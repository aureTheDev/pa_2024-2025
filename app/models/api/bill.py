from pydantic import constr , BaseModel , ConfigDict
from datetime import datetime
from .api_base import MyBaseModel

class BillCompanyResponse(MyBaseModel):
    model_config = ConfigDict(from_attributes=True)
    company_id: constr(min_length=36, max_length=36)
    company_subscription_id: constr(min_length=36, max_length=36)
    file: str
    payed: bool
    

class BillAdminResponse(BaseModel):
    company_subscription_id: constr(min_length=36, max_length=36)
    file: str
    payed: bool
    company_name: str
    subscription_status: str
