from sqlalchemy import Column, String, Numeric, Date, Enum as SQLEnum, Integer, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.models.base import BaseModel
import enum

class SubscriptionStatus(str, enum.Enum):
    DRAFT = "draft"
    QUOTATION = "quotation"
    CONFIRMED = "confirmed"
    ACTIVE = "active"
    CLOSED = "closed"
    PAUSED = "paused"

class Subscription(BaseModel):
    __tablename__ = "subscriptions"

    subscription_number = Column(String(50), unique=True, nullable=False, index=True)
    customer_id = Column(Integer, nullable=False)
    plan_id = Column(Integer, nullable=False)
    created_by_id = Column(Integer, nullable=False)
    start_date = Column(Date, nullable=False)
    expiry_date = Column(Date)
    payment_terms = Column(String(100))
    status = Column(SQLEnum(SubscriptionStatus), default=SubscriptionStatus.DRAFT)
    notes = Column(Text)

    # Relationships
    customer = relationship("User", back_populates="subscriptions", foreign_keys=[customer_id])
    created_by = relationship("User", back_populates="created_subscriptions", foreign_keys=[created_by_id])
    plan = relationship("Plan", back_populates="subscriptions")
    lines = relationship("SubscriptionLine", back_populates="subscription", cascade="all, delete-orphan")
    invoices = relationship("Invoice", back_populates="subscription")

class SubscriptionLine(BaseModel):
    __tablename__ = "subscription_lines"

    subscription_id = Column(Integer, nullable=False)
    product_id = Column(Integer, nullable=False)
    variant_id = Column(Integer)
    quantity = Column(Integer, nullable=False, default=1)
    unit_price = Column(Numeric(10, 2), nullable=False)
    tax_rate = Column(Numeric(5, 2), default=0)
    amount = Column(Numeric(10, 2), nullable=False)

    subscription = relationship("Subscription", back_populates="lines")
    product = relationship("Product", back_populates="subscription_lines")
