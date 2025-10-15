from sqlmodel import SQLModel, Field
from uuid import UUID, uuid4
from datetime import datetime
from typing import Optional

class RoomTable(SQLModel, table=True):
    __tablename__ = "rooms"

    room_id: str = Field(default_factory=uuid4, primary_key=True)
    max_size: int = Field(nullable=False)