from alembic import op
import sqlalchemy as sa


revision = "20261006_01"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    inspector = sa.inspect(op.get_bind())
    if "users" not in inspector.get_table_names():
        return

    columns = {column["name"] for column in inspector.get_columns("users")}
    if "username" in columns:
        return

    op.add_column("users", sa.Column("username", sa.String(length=80), nullable=True))
    if "phone" not in columns:
        op.add_column("users", sa.Column("phone", sa.String(length=30), nullable=True))

    connection = op.get_bind()
    rows = connection.execute(sa.text("SELECT id, email, full_name FROM users ORDER BY id")).mappings()
    usernames = set()
    for row in rows:
        base_username = (row["email"] or "").split("@", maxsplit=1)[0].strip().lower()
        if not base_username:
            base_username = "user"
        username = base_username
        if username in usernames:
            username = f"{base_username}-{row['id']}"
        usernames.add(username)
        connection.execute(
            sa.text("UPDATE users SET username = :username WHERE id = :user_id"),
            {"username": username, "user_id": row["id"]},
        )

    with op.batch_alter_table("users") as batch_op:
        batch_op.alter_column("username", existing_type=sa.String(length=80), nullable=False)
        batch_op.alter_column("email", existing_type=sa.String(length=255), nullable=True)
        batch_op.create_unique_constraint("uq_users_username", ["username"])


def downgrade() -> None:
    with op.batch_alter_table("users") as batch_op:
        batch_op.drop_constraint("uq_users_username", type_="unique")
        batch_op.drop_column("phone")
        batch_op.drop_column("username")