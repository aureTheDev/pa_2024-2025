# models/administrators_model.py
from sqlmodel import SQLModel, Field


class AdministratorTable(SQLModel, table=True):
    __tablename__ = "administrators"
    admin_id: str = Field(primary_key=True, foreign_key="users.user_id", min_length=36, max_length=36)