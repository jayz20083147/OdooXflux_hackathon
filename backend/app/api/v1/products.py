from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
from app.db.database import SessionLocal
from app.models.product import Product, ProductVariant
from app.core.security import get_admin_user
from app.models.user import User
from pydantic import BaseModel
from decimal import Decimal

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Pydantic schemas
class ProductCreate(BaseModel):
    name: str
    product_type: str
    sales_price: Decimal
    cost_price: Optional[Decimal] = Decimal("0")
    notes: Optional[str] = None
    sku: Optional[str] = None
    tax_rate_id: Optional[int] = None

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    product_type: Optional[str] = None
    sales_price: Optional[Decimal] = None
    cost_price: Optional[Decimal] = None
    notes: Optional[str] = None
    sku: Optional[str] = None
    tax_rate_id: Optional[int] = None

class ProductResponse(BaseModel):
    id: int
    name: str
    product_type: str
    sales_price: Decimal
    cost_price: Decimal
    notes: Optional[str] = None
    sku: Optional[str] = None
    created_at: str

    class Config:
        from_attributes = True

class ProductVariantCreate(BaseModel):
    variant_name: str
    price_adjustment: Decimal = Decimal("0")
    description: Optional[str] = None

@router.get("/", response_model=List[ProductResponse])
async def list_products(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = None
):
    query = db.query(Product)

    if search:
        query = query.filter(
            or_(
                Product.name.ilike(f"%{search}%"),
                Product.sku.ilike(f"%{search}%")
            )
        )

    products = query.offset(skip).limit(limit).all()
    return products

@router.post("/", response_model=ProductResponse)
async def create_product(
    product: ProductCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    # Check if SKU already exists
    if product.sku:
        existing = db.query(Product).filter(Product.sku == product.sku).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="SKU already exists"
            )

    db_product = Product(**product.dict())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: int,
    product_update: ProductUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    update_data = product_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(product, field, value)

    db.commit()
    db.refresh(product)
    return product

@router.delete("/{product_id}")
async def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    db.delete(product)
    db.commit()
    return {"message": "Product deleted successfully"}

@router.post("/{product_id}/variants")
async def create_variant(
    product_id: int,
    variant: ProductVariantCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    db_variant = ProductVariant(
        product_id=product_id,
        variant_name=variant.variant_name,
        price_adjustment=variant.price_adjustment,
        description=variant.description
    )
    db.add(db_variant)
    db.commit()
    db.refresh(db_variant)
    return db_variant
