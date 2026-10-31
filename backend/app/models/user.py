from sqlalchemy import Column, String, Enum as SQLEnum
from sqlalchemy.orm import relationship
from app.models.base import BaseModel
import enum

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    STAFF = "staff"
    CUSTOMER = "customer"

class User(BaseModel):
    __tablename__ = "users"

    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255))
    role = Column(SQLEnum(UserRole), default=UserRole.CUSTOMER)
    phone = Column(String(20))
    is_verified = Column(String(1), default="N")
    last_login = Column(String(255))

    # Relationships
    subscriptions = relationship("Subscription", back_populates="customer", foreign_keys="Subscription.customer_id")
    created_subscriptions = relationship("Subscription", back_populates="created_by", foreign_keys="Subscription.created_by_id")
    invoices = relationship("Invoice", back_populates="customer", foreign_keys="Invoice.customer_id")
    quotations = relationship("Quotation", back_populates="customer", foreign_keys="Quotation.customer_id")
