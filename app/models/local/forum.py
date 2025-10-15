from pydantic import BaseModel, constr
from datetime import datetime
from typing import Optional
from uuid import UUID

class CategorySchema(BaseModel):
    category_id: constr(min_length=36, max_length=36)
    title: str

class SubjectSchema(BaseModel):
    subject_id: constr(min_length=36, max_length=36)
    title: str
    category_id: constr(min_length=36, max_length=36)
    collaborator_id:constr(min_length=36, max_length=36)
    creation_date: Optional[datetime] = None


class SubjectAdminResponse(BaseModel):
    subject_id: constr(min_length=36, max_length=36)
    title: str
    creation_date: datetime
    category_name: str
    collaborator_name: str
class SubjectCreateSchema(BaseModel):
    title: str
    category_id: constr(min_length=36, max_length=36)

class PostSchema(BaseModel):
    post_id: constr(min_length=36, max_length=36)
    text: str
    subject_id: constr(min_length=36, max_length=36)
    collaborator_id: constr(min_length=36, max_length=36)
    creation_date: Optional[datetime] = None
    parent_post_id: Optional[str] = None
