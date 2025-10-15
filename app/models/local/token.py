from datetime import datetime
from pydantic import BaseModel, constr

class TokenData(BaseModel):
    user_id: constr(min_length=36, max_length=36)
    session_id: constr(min_length=32, max_length=32)
    function: str
    exp: datetime
    iat: datetime
    verified: bool