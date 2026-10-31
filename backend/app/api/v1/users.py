from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
from app.db.database import SessionLocal
from app.models.user import User
from app.schemas.user import UserResponse, UserUpdate
from app.core.security import get_current_user, get_admin_user
from app.core.security import verify_password, get_password_hash

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/", response_model=List[UserResponse])
async def list_users(
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = None,
    role: Optional[str] = None
):
    query = db.query(User)

    if search:
        query = query.filter(
            or_(
                User.email.ilike(f"%{search}%"),
                User.username.ilike(f"%{search}%"),
                User.full_name.ilike(f"%{search}%")
            )
        )

    if role:
        query = query.filter(User.role == role)

    users = query.offset(skip).limit(limit).all()
    return users

@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Customers can only see their own profile
    if current_user.role == "customer" and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    return user

@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    user_update: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Authorization check
    if current_user.role == "customer" and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Only admin can change roles
    if user_update.role and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admin can change roles")

    # Update fields
    update_data = user_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)

    db.commit()
    db.refresh(user)
    return user

@router.delete("/{user_id}")
async def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Don't delete self
    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot delete own account")

    db.delete(user)
    db.commit()
    return {"message": "User deleted successfully"}

@router.get("/{user_id}/subscriptions")
async def get_user_subscriptions(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Check authorization
    if current_user.role == "customer" and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    subscriptions = db.query(User.subscriptions).filter(User.id == user_id).all()
    return subscriptions
