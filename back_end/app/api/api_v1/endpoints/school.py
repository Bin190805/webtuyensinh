from fastapi import APIRouter, HTTPException, Depends
from app.database.database import db
from app.utils.auth import Auth
from bson import ObjectId

router = APIRouter()

@router.get("/schools")
def get_all_school_full_info(current_user=Depends(Auth())):
    schools = list(db.schools.find())
    
    for school in schools:
        school.pop("majors", None)  # Xóa trường "majors" nếu có
        school["_id"] = str(school["_id"])
        
    return schools


# GET các ngành của một trường cụ thể kèm tổ hợp chi tiết
@router.get("/schools/{school_code}/majors")
def get_majors_by_school(school_code: str, current_user=Depends(Auth())):
    school = db.schools.find_one({"code": school_code})
    if not school:
        raise HTTPException(status_code=404, detail="School not found")

    subject_combinations = {sc["code"]: sc for sc in db.subject_combinations.find()}
    subjects = {s["code"]: s for s in db.subjects.find()}

    majors = []
    for major in school.get("majors", []):
        major_result = {
            "code": major.get("code"),
            "name": major.get("name"),
            "subject_group_ids": major.get("subject_group_ids")
        }

        majors.append(major_result)

    return majors

@router.get("/subject-combinations/{code}")
def get_subject_combination_detail(code: str, current_user=Depends(Auth())):
    subject_combination = db.subject_combination.find_one({"code": code})
    if not subject_combination:
        raise HTTPException(status_code=404, detail="Subject combination not found")

    all_subjects = {s["code"]: s for s in db.subject.find()}

    subject_codes = subject_combination.get("subjects", [])
    full_subjects = [all_subjects.get(sub_code) for sub_code in subject_codes if sub_code in all_subjects]

    if not full_subjects:
        raise HTTPException(status_code=404, detail="Subjects details not found")

    subject_combination["subjects"] = full_subjects

    subject_combination.pop("_id", None)

    for subject in subject_combination["subjects"]:
        subject.pop("_id", None)

    return subject_combination


