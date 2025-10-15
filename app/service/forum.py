
from sqlalchemy.orm import Session
from fastapi import HTTPException
from queries import forum_queries

# --- Categories ---
def create_category(db: Session, title: str):
    if not title:
        raise HTTPException(status_code=400, detail="Title is required")
    return forum_queries.create_category(db, title)

def get_categories(db: Session):
    return forum_queries.get_categories(db)

def get_category(db: Session, cat_id: str):
    category = forum_queries.get_category(db, cat_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return category

def delete_category(db: Session, cat_id: str):
    if not forum_queries.delete_category(db, cat_id):
        raise HTTPException(status_code=404, detail="Category not found")
    return {"message": "Category deleted"}


# --- Subjects ---
def create_subject(db: Session, data: dict):
    required_fields = ["title", "category_id"]  
    for field in required_fields:
        if field not in data:
            raise HTTPException(status_code=400, detail=f"{field} is required")
    return forum_queries.create_subject(db, data)

def get_subjects_by_category(db: Session, cat_id: str):
    return forum_queries.get_subjects_by_category(db, cat_id)

def get_subject(db: Session, subject_id: str):
    subject = forum_queries.get_subject(db, subject_id)
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    return subject

def delete_subject(db: Session, subject_id: str):
    if not forum_queries.delete_subject(db, subject_id):
        raise HTTPException(status_code=404, detail="Subject not found")
    return {"message": "Subject deleted"}


# --- Posts ---
def create_post(db: Session, data: dict):
    required_fields = ["text", "subject_id"]  
    for field in required_fields:
        if field not in data:
            raise HTTPException(status_code=400, detail=f"{field} is required")
    return forum_queries.create_post(db, data)

def get_posts_by_subject(db: Session, subject_id: str):
    return forum_queries.get_posts_by_subject(db, subject_id)

def delete_post(db: Session, post_id: str):
    if not forum_queries.delete_post(db, post_id):
        raise HTTPException(status_code=404, detail="Post not found")
    return {"message": "Post deleted"}


# --- Reports ---
def create_report(db: Session, data: dict):
    if "title" not in data:
        raise HTTPException(status_code=400, detail="Title is required")
    return forum_queries.create_report(db, data)

def get_reports(db: Session):
    return forum_queries.get_reports(db)

def delete_report(db: Session, report_id: str):
    if not forum_queries.delete_report(db, report_id):
        raise HTTPException(status_code=404, detail="Report not found")
    return {"message": "Report deleted"}