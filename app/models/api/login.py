from pydantic import EmailStr, BaseModel
from .api_base import MyBaseModel
class LoginRequest(MyBaseModel):
    email: EmailStr
    password: str

class LoginResponse(MyBaseModel):
    token: str