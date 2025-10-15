from sqlalchemy.orm import Session
from models.database import categories_model, subjects_model, posts_model, reports_model



# --- Categories ---
def create_category(db: Session, title: str):
    category = categories_model.Category(title=title)
    db.add(category)
    db.commit()
    db.refresh(category)
    return category

def get_categories(db: Session):
    return db.query(categories_model.Category).all()

def get_category(db: Session, category_id: str):
    return db.query(categories_model.Category).filter_by(category_id=category_id).first()

def delete_category(db: Session, category_id: str):
    category = get_category(db, category_id)
    if category:
        db.delete(category)
        db.commit()
        return True
    return False


# --- Subjects ---
def create_subject(db: Session, data: dict):
    subject = subjects_model.Subject(**data)
    db.add(subject)
    db.commit()
    db.refresh(subject)
    return subject

def get_subjects_by_category(db: Session, category_id: str):
    return db.query(subjects_model.Subject).filter_by(category_id=category_id).all()

def get_subject(db: Session, subject_id: str):
    return db.query(subjects_model.Subject).filter_by(subject_id=subject_id).first()

def delete_subject(db: Session, subject_id: str):
    subject = get_subject(db, subject_id)
    if subject:
        db.delete(subject)
        db.commit()
        return True
    return False


# --- Posts ---
def create_post(db: Session, data: dict):
    post = posts_model.Post(**data)
    db.add(post)
    db.commit()
    db.refresh(post)
    return post

def get_posts_by_subject(db: Session, subject_id: str):
    return db.query(posts_model.Post).filter_by(subject_id=subject_id).all()

def delete_post(db: Session, post_id: str):
    post = db.query(posts_model.Post).filter_by(post_id=post_id).first()
    if post:
        db.delete(post)
        db.commit()
        return True
    return False


# --- Reports ---
def create_report(db: Session, data: dict):
    report = reports_model.Report(**data)
    db.add(report)
    db.commit()
    db.refresh(report)
    return report

def get_reports(db: Session):
    return db.query(reports_model.Report).all()

def delete_report(db: Session, report_id: str):
    report = db.query(reports_model.Report).filter_by(report_id=report_id).first()
    if report:
        db.delete(report)
        db.commit()
        return True
    return False
