from pydantic import constr , BaseModel , ConfigDict
from .api_base import MyBaseModel
from datetime import datetime

class CalendarRequest(MyBaseModel):
    unvailable_begin_date: datetime
    unvailable_end_date: datetime