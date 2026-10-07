from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.database.database import get_db
from app.models.notification import Notification
from app.models.user import User
from app.schemas.notification import NotificationCreate, NotificationRead

router = APIRouter()


@router.get("", response_model=list[NotificationRead])
def list_notifications(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Notification).filter(Notification.user_id == current_user.id).order_by(Notification.created_at.desc()).all()


@router.post("/{notification_id}/read")
def mark_notification_read(notification_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    notification = db.query(Notification).filter(Notification.id == notification_id, Notification.user_id == current_user.id).first()
    if not notification:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
    notification.is_read = True
    db.commit()
    return {"detail": "Notification marked as read"}


@router.post("/read-all")
def read_all_notifications(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db.query(Notification).filter(Notification.user_id == current_user.id, Notification.is_read.is_(False)).update({"is_read": True})
    db.commit()
    return {"detail": "All notifications marked as read"}


@router.post("", response_model=NotificationRead)
def create_notification(payload: NotificationCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    notification = Notification(user_id=current_user.id, **payload.model_dump())
    db.add(notification)
    db.commit()
    db.refresh(notification)
    return notification
