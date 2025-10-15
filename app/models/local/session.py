from dataclasses import Field
from datetime import datetime

from pydantic import BaseModel, constr, ConfigDict

class SessionSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    session_id: constr(min_length=32, max_length=32)
    user_id: constr(min_length=36, max_length=36)
    creation_date: datetime
    exp_date: datetime
    revoked: bool
    