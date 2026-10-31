from sqlalchemy import Column, String, Numeric, Date, Integer, Text
from sqlalchemy.orm import relationship
from app.models.base import BaseModel

class Payment(BaseModel):
    __tablename__ = "payments"

    invoice_id = Column(Integer, nullable=False)
    payment_method = Column(String(100), nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    payment_date = Column(Date, nullable=False)
    reference_number = Column(String(100))
    notes = Column(Text)

    invoice = relationship("Invoice", back_populates="payments")

class TaxRule(BaseModel):
    __tablename__ = "tax_rules"

    name = Column(String(255), nullable=False)
    tax_rate = Column(Numeric(5, 2), nullable=False)
    country = Column(String(100))
    region = Column(String(100))
    effective_from = Column(Date)
    effective_to = Column(Date)

class DiscountRule(BaseModel):
    __tablename__ = "discount_rules"

    name = Column(String(255), nullable=False)
    discount_type = Column(String(20), nullable=False)  # fixed or percentage
    discount_value = Column(Numeric(10, 2), nullable=False)
    minimum_purchase = Column(Numeric(10, 2), default=0)
    minimum_quantity = Column(Integer, default=1)
    start_date = Column(Date)
    end_date = Column(Date)
    max_uses = Column(Integer)
    used_count = Column(Integer, default=0)
    applies_to_products = Column(String(255))  # Comma-separated product IDs
    applies_to_all = Column(String(1), default="N")

class Quotation(BaseModel):
    __tablename__ = "quotations"

    quotation_number = Column(String(50), unique=True, nullable=False, index=True)
    customer_id = Column(Integer, nullable=False)
    template_id = Column(Integer)
    issue_date = Column(Date, nullable=False)
    expiry_date = Column(Date, nullable=False)
    status = Column(String(50), default="draft")
    notes = Column(Text)

    customer = relationship("User", back_populates="quotations", foreign_keys=["customer_id"])
