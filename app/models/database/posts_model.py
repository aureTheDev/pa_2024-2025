# models/posts_model.py
from sqlmodel import SQLModel, Field
from typing import Optional
from uuid import UUID, uuid4
from datetime import datetime , timezone


class Post(SQLModel, table=True):
    __tablename__ = "posts"

    post_id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True, nullable=False)
    text: str = Field(nullable=False)
    creation_date: datetime =  Field(nullable=False, default_factory=lambda: datetime.now(timezone.utc))
    parent_post_id: Optional[str] = Field(default=None, foreign_key="posts.post_id")
    subject_id: str = Field(nullable=False, foreign_key="subjects.subject_id")
    collaborator_id: str = Field(nullable=False, foreign_key="collaborators.collaborator_id")