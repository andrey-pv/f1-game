from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.auth import verify_firebase_token, get_current_user

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=schemas.LoginResponse)
def login(request: schemas.LoginRequest, db: Session = Depends(get_db)):
    decoded = verify_firebase_token(request.id_token)

    uid = decoded.get("uid")
    email = decoded.get("email", "")
    name = decoded.get("name", "")
    picture = decoded.get("picture", "")

    user = db.query(models.User).filter(models.User.google_uid == uid).first()
    if not user:
        user = models.User(
            google_uid=uid,
            email=email,
            display_name=name,
            avatar_url=picture,
        )
        db.add(user)
    else:
        user.display_name = name
        user.avatar_url = picture

    db.commit()
    db.refresh(user)
    return {"user": user, "message": "Login successful"}


@router.get("/me", response_model=schemas.UserOut)
def get_me(current_user: models.User = Depends(get_current_user)):
    return current_user
