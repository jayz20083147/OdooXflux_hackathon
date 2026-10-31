from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse, UserLogin, Token, PasswordResetRequest, PasswordReset
from app.core.security import (
    verify_password, get_password_hash, create_access_token,
    create_refresh_token, validate_password_strength, get_admin_user
)
from datetime import datetime

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/register", response_model=UserResponse)
async def register(user: UserCreate, db: Session = Depends(get_db)):
    # Check if email already exists
    existing_user_email = db.query(User).filter(User.email == user.email).first()
    if existing_user_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Check if username already exists
    existing_user_username = db.query(User).filter(User.username == user.username).first()
    if existing_user_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken"
        )

    # Validate password strength
    is_valid, message = validate_password_strength(user.password)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=message
        )

    # Create new user
    db_user = User(
        email=user.email,
        username=user.username,
        full_name=user.full_name,
        phone=user.phone,
        role=user.role,
        hashed_password=get_password_hash(user.password)
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Update last login
    user.last_login = datetime.utcnow().isoformat()
    db.commit()

    access_token = create_access_token(data={"sub": user.username})
    refresh_token = create_refresh_token(data={"sub": user.username})

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_in": 1800
    }

@router.post("/password-reset/request")
async def password_reset_request(request: PasswordResetRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        # Don't reveal if email exists
        return {"message": "If email exists, reset link will be sent"}

    # In production, send email with reset token
    # For hackathon, just return success
    return {"message": "Password reset link sent to email"}

@router.post("/password-reset/confirm")
async def password_reset_confirm(reset: PasswordReset, db: Session = Depends(get_db)):
    # In production, verify token
    # For hackathon, simplify
    is_valid, message = validate_password_strength(reset.new_password)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=message
        )
    return {"message": "Password reset successful"}

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_admin_user)):
    return current_user

@router.post("/staff", response_model=UserResponse)
async def create_staff_member(
    user: UserCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    # Only admin can create staff
    if user.role != "staff":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only staff members can be created via this endpoint"
        )

    existing_user = db.query(User).filter(
        (User.email == user.email) | (User.username == user.username)
    ).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already exists"
        )

    is_valid, message = validate_password_strength(user.password)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=message
        )

    db_user = User(
        email=user.email,
        username=user.username,
        full_name=user.full_name,
        phone=user.phone,
        role=user.role,
        hashed_password=get_password_hash(user.password)
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user
