from fastapi import APIRouter, Header, HTTPException
from queries import forum_queries
from queries.base_queries import BaseQuery
from queries.user_queries import UserQuery
from service.user import User 
from models.database.users_model import UserTable
from models.local.forum import SubjectCreateSchema, SubjectSchema

router = APIRouter(tags=["Forum"])


def get_user_from_token_header(token: str):
    query = UserQuery()
    user = User(query=query, token=token)
    return user


# --- Categories ---
@router.post("/categories")
def create_category(title: str, token: str = Header(...)):
    db = BaseQuery().get_session()
    user = get_user_from_token_header(token)
    return forum_queries.create_category(db, title)

@router.get("/categories")
def get_all_categories(token: str = Header(...)):
    db = BaseQuery().get_session()
    user = get_user_from_token_header(token)
    return forum_queries.get_categories(db)

@router.get("/categories/{cat_id}")
def get_category(cat_id: str, token: str = Header(...)):
    db = BaseQuery().get_session()
    user = get_user_from_token_header(token)
    category = forum_queries.get_category(db, cat_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return category

@router.delete("/categories/{cat_id}")
def delete_category(cat_id: str, token: str = Header(...)):
    db = BaseQuery().get_session()
    user = get_user_from_token_header(token)
    if not forum_queries.delete_category(db, cat_id):
        raise HTTPException(status_code=404, detail="Category not found")
    return {"message": "Category deleted"}


# --- Subjects ---
@router.post("/subjects", response_model=SubjectSchema)
def create_subject(data: SubjectCreateSchema, token: str = Header(...)):
    db = BaseQuery().get_session()
    user = get_user_from_token_header(token)
    data_dict = data.dict()
    data_dict['collaborator_id'] = user.user_id
    return forum_queries.create_subject(db, data_dict)

@router.get("/categories/{cat_id}/subjects")
def get_subjects_by_category(cat_id: str, token: str = Header(...)):
    db = BaseQuery().get_session()
    user = get_user_from_token_header(token)
    return forum_queries.get_subjects_by_category(db, cat_id)

@router.get("/subjects/{subj_id}")
def get_subject(subj_id: str, token: str = Header(...)):
    db = BaseQuery().get_session()
    user = get_user_from_token_header(token)
    subject = forum_queries.get_subject(db, subj_id)
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    return subject

@router.delete("/subjects/{subj_id}")
def delete_subject(subj_id: str, token: str = Header(...)):
    db = BaseQuery().get_session()
    user = get_user_from_token_header(token)
    if not forum_queries.delete_subject(db, subj_id):
        raise HTTPException(status_code=404, detail="Subject not found")
    return {"message": "Subject deleted"}


# --- Posts ---
@router.post("/posts")
def create_post(data: dict, token: str = Header(...)):
    db = BaseQuery().get_session()
    user = get_user_from_token_header(token)
    data['collaborator_id'] = user.user_id  
    return forum_queries.create_post(db, data)

@router.get("/subjects/{subj_id}/posts")
def get_posts(subj_id: str, token: str = Header(...)):
    db = BaseQuery().get_session()
    user = get_user_from_token_header(token)
    posts = forum_queries.get_posts_by_subject(db, subj_id)

    results = []
    for post in posts:
        collaborator = db.query(UserTable).filter(UserTable.user_id == post.collaborator_id).first()
        results.append({
            "post_id": post.post_id,
            "text": post.text,
            "creation_date": post.creation_date,
            "subject_id": post.subject_id,
            "collaborator_id": post.collaborator_id,
            "firstname": collaborator.firstname if collaborator else "",
            "lastname": collaborator.lastname if collaborator else "",
        })

    return results

@router.delete("/posts/{post_id}")
def delete_post(post_id: str, token: str = Header(...)):
    db = BaseQuery().get_session()
    user = get_user_from_token_header(token)
    if not forum_queries.delete_post(db, post_id):
        raise HTTPException(status_code=404, detail="Post not found")
    return {"message": "Post deleted"}


# --- Reports ---
@router.post("/reports")
def create_report(data: dict, token: str = Header(...)):
    db = BaseQuery().get_session()
    user = get_user_from_token_header(token)
    data['collaborator_id'] = user.user_id
    return forum_queries.create_report(db, data)

@router.get("/reports")
def get_reports(token: str = Header(...)):
    db = BaseQuery().get_session()
    user = get_user_from_token_header(token)
    return forum_queries.get_reports(db)

@router.delete("/reports/{report_id}")
def delete_report(report_id: str, token: str = Header(...)):
    db = BaseQuery().get_session()
    user = get_user_from_token_header(token)
    if not forum_queries.delete_report(db, report_id):
        raise HTTPException(status_code=404, detail="Report not found")
    return {"message": "Report deleted"}
