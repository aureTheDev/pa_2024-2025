# models/calendars_model.py
from sqlmodel import SQLModel, Field
from uuid import UUID
from datetime import datetime


class CalendarTable(SQLModel, table=True):
    __tablename__ = "calendars"

    contractor_id: str = Field(primary_key=True, foreign_key="contractors.contractor_id")
    calendar_id: str = Field(primary_key=True)
    unvailable_begin_date: datetime = Field(nullable=False)
    unvailable_end_date: datetime = Field(nullable=False)