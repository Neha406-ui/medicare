from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import require_admin
from app.database.database import get_db
from app.models.audit_log import AuditLog
from app.models.inventory import Inventory
from app.models.user import User
from app.schemas.inventory import InventoryCreate, InventoryRead, InventoryUpdate
from app.services.inventory_service import get_stock_status

router = APIRouter()


@router.get("", response_model=list[InventoryRead])
def list_inventory(db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    return db.query(Inventory).all()


@router.post("", response_model=InventoryRead)
def create_inventory(payload: InventoryCreate, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    item = Inventory(**payload.model_dump())
    db.add(item)
    db.flush()
    db.add(AuditLog(
        user_id=current_user.id,
        action="inventory.created",
        entity_type="inventory",
        entity_id=item.id,
        description=f"Added an inventory batch for {item.medicine_name}.",
    ))
    db.commit()
    db.refresh(item)
    return item


@router.put("/{inventory_id}", response_model=InventoryRead)
def update_inventory(inventory_id: int, payload: InventoryUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    item = db.query(Inventory).filter(Inventory.id == inventory_id).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inventory item not found")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(item, key, value)
    db.add(AuditLog(
        user_id=current_user.id,
        action="inventory.updated",
        entity_type="inventory",
        entity_id=item.id,
        description=f"Updated inventory for {item.medicine_name}.",
    ))
    db.commit()
    db.refresh(item)
    return item


@router.delete("/{inventory_id}")
def delete_inventory(inventory_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    item = db.query(Inventory).filter(Inventory.id == inventory_id).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inventory item not found")
    db.add(AuditLog(
        user_id=current_user.id,
        action="inventory.deleted",
        entity_type="inventory",
        entity_id=item.id,
        description=f"Deleted inventory batch for {item.medicine_name}.",
    ))
    db.delete(item)
    db.commit()
    return {"detail": "Inventory item deleted"}


@router.get("/alerts")
def inventory_alerts(db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    items = db.query(Inventory).all()
    alerts = []
    for item in items:
        status = get_stock_status(item)
        if status in {"LOW_STOCK", "CRITICAL", "EXPIRED"}:
            alerts.append({"medicine_name": item.medicine_name, "status": status, "current_stock": item.current_stock})
    return alerts
