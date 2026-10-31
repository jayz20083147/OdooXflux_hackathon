from sqlalchemy import Column, String, Numeric, Text
from sqlalchemy.orm import relationship
from app.models.base import BaseModel

class Product(BaseModel):
    __tablename__ = "products"

    name = Column(String(255), nullable=False, index=True)
    product_type = Column(String(100), nullable=False)
    sales_price = Column(Numeric(10, 2), nullable=False)
    cost_price = Column(Numeric(10, 2), default=0)
    notes = Column(Text)
    sku = Column(String(100), unique=True)
    tax_rate_id = Column(Integer)

    # Relationships
    product_variants = relationship("ProductVariant", back_populates="product", cascade="all, delete-orphan")
    subscription_lines = relationship("SubscriptionLine", back_populates="product")
    invoice_lines = relationship("InvoiceLine", back_populates="product")

class ProductVariant(BaseModel):
    __tablename__ = "product_variants"

    product_id = Column(Integer, nullable=False)
    variant_name = Column(String(255), nullable=False)
    price_adjustment = Column(Numeric(10, 2), default=0)
    description = Column(Text)

    product = relationship("Product", back_populates="product_variants")
