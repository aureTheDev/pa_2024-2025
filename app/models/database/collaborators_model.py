# models/collaborators_model.py
from sqlmodel import SQLModel, Field


class CollaboratorTable(SQLModel, table=True):
    __tablename__ = "collaborators"

    collaborator_id: str = Field(primary_key=True, foreign_key="users.user_id", min_length=36, max_length=36)
    company_id: str = Field(nullable=False, foreign_key="companies.company_id", min_length=36, max_length=36)