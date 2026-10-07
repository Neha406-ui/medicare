from getpass import getpass

from app.core.security import get_password_hash
from app.database.database import SessionLocal, init_db
from app.models.audit_log import AuditLog
from app.models.user import User, UserRole


def main() -> None:
    init_db()
    username = input("Administrator username: ").strip()
    if not username:
        raise ValueError("Administrator username cannot be empty.")

    password = getpass("Administrator password (at least 8 characters): ")
    if len(password) < 8:
        raise ValueError("Administrator password must contain at least 8 characters.")
    confirmation = getpass("Confirm password: ")
    if password != confirmation:
        raise ValueError("Passwords do not match.")

    full_name = input("Administrator full name: ").strip()
    if len(full_name) < 2:
        raise ValueError("Administrator full name must contain at least 2 characters.")

    with SessionLocal() as db:
        if db.query(User).filter(User.role == UserRole.ADMINISTRATOR).first():
            raise RuntimeError("An administrator account already exists; refusing to create another bootstrap account.")
        if db.query(User).filter(User.username == username).first():
            raise ValueError("That username is already in use.")

        admin = User(
            username=username,
            full_name=full_name,
            password_hash=get_password_hash(password),
            role=UserRole.ADMINISTRATOR,
            is_active=True,
        )
        db.add(admin)
        db.flush()
        db.add(AuditLog(
            user_id=admin.id,
            action="administrator.bootstrap_created",
            entity_type="user",
            entity_id=admin.id,
            description="Created the first administrator account through the interactive bootstrap command.",
        ))
        db.commit()

    print(f"Administrator account '{username}' created.")


if __name__ == "__main__":
    main()
