# models/categories_model.py
from sqlmodel import SQLModel, Field
from uuid import UUID, uuid4
from typing import Optional


class Category(SQLModel, table=True):
    __tablename__ = "categories"

    category_id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True, nullable=False)
    title: str = Field(nullable=False, unique=True, max_length=255)
 