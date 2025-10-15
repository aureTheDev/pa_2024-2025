from pydantic import constr ,BaseModel, ConfigDict
from typing import Optional
from .api_base import MyBaseModel
from typing import Optional

class CompanySubscriptionResponse(MyBaseModel):
    model_config = ConfigDict(from_attributes=True)

    company_subscription_id: constr(min_length=36, max_length=36)
    company_id: constr(min_length=36, max_length=36)
    bonus_consultation_number: int
    status: Optional[str]
    pack_id: constr(min_length=36, max_length=36)

