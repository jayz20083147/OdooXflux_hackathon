from sqlalchemy import Column, String, Numeric, Date, Enum as SQLEnum, Integer, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.models.base import BaseModel
import enum

class InvoiceStatus(str, enum.Enum):
    DRAFT = "draft"
    CONFIRMED = "confirmed"
    PAID = "paid"
    CANCELLED = "cancelled"

class Invoice(BaseModel):
    __tablename__ = "invoices"

    invoice_number = Column(String(50), unique=True, nullable=False, index=True)
    subscription_id = Column(Integer, nullable=False)
    customer_id = Column(Integer, nullable=False)
    issue_date = Column(Date, nullable=False)
    due_date = Column(Date, nullable=False)
    status = Column(SQLEnum(InvoiceStatus), default=InvoiceStatus.DRAFT)
    subtotal = Column(Numeric(10, 2), default=0)
    tax_amount = Column(Numeric(10, 2), default=0)
    discount_amount = Column(Numeric(10, 2), default=0)
    total_amount = Column(Numeric(10, 2), nullable=False)
    notes = Column(Text)

    # Relationships
    subscription = relationship("Subscription", back_populates="invoices")
    customer = relationship("User", back_populates="invoices", foreign_keys=[customer_id])
    lines = relationship("InvoiceLine", back_populates="invoice", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="invoice")

class InvoiceLine(BaseModel):
    __tablename__ = "invoice_lines"

    invoice_id = Column(Integer, nullable=False)
    product_id = Column(Integer, nullable=False)
    quantity = Column(Integer, nullable=False, default=1)
    unit_price = Column(Numeric(10, 2), nullable=False)
    tax_rate = Column(Numeric(5, 2), default=0)
    amount = Column(Numeric(10, 2), nullable=False)

    invoice = relationship("Invoice", back_populates="lines")
    product = relationship("Product", back_populates="invoice_lines")
