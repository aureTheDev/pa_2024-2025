from pydantic import BaseModel, ConfigDict, constr

class CompanySubscriptionCreate(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    company_id: constr(min_length=36, max_length=36)
    bonus_consultation_number: int
    status: str | None = None
    pack_id: constr(min_length=36, max_length=36)
