from typing import Literal, Optional
from pydantic import constr , BaseModel , ConfigDict
from datetime import datetime, date, time
from .api_base import MyBaseModel
from datetime import datetime

class BookMedicalAppointmentRequest(MyBaseModel):
    contractor_id: constr(min_length=36, max_length=36)
    appointment_datetime_utc: datetime
    appointment_type: Literal["incall", "outcall"]


class MedicalAppointmentResponse(MyBaseModel):
    medical_appointment_id: str
    contractor_id: str
    medical_appointment_date: datetime
    creation_date: datetime
    place: Literal["incall", "outcall"]
    bill_file: str
    status: Literal["PAYED", "CANCELED"]
    note: Optional[int]