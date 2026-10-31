from sqlalchemy import Column, String, Numeric, Date, Enum as SQLEnum, Text
from sqlalchemy.orm import relationship
from app.models.base import BaseModel
import enum

class BillingFrequency(str, enum.Enum):
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    YEARLY = "yearly"

class PlanLifecycle(str, enum.Enum):
    AUTO_CLOSE = "auto_close"
    MANUAL_CLOSE = "manual_close"
    PAUSABLE = "pausable"
    RENEWABLE = "renewable"

class Plan(BaseModel):
    __tablename__ = "plans"

    name = Column(String(255), nullable=False, index=True)
    product_id = Column(Integer, nullable=False)
    cost = Column(Numeric(10, 2), nullable=False)
    billing_frequency = Column(SQLEnum(BillingFrequency), nullable=False)
    minimum_quantity = Column(Integer, default=1)
    start_date = Column(Date)
    end_date = Column(Date)
    lifecycle_type = Column(SQLEnum(PlanLifecycle), nullable=False)
    notes = Column(Text)

    # Relationships
    subscriptions = relationship("Subscription", back_populates="plan")
    quotations = relationship("QuotationTemplate", back_populates="plan")

class QuotationTemplate(BaseModel):
    __tablename__ = "quotation_templates"

    name = Column(String(255), nullable=False)
    plan_id = Column(Integer, nullable=False)
    validity_days = Column(Integer, default=30)
    notes = Column(Text)

    plan = relationship("Plan", back_populates="quotations")
