from alembic import op
import sqlalchemy as sa


revision = "20261007_02"
down_revision = "20261007_01"
branch_labels = None
depends_on = None


def upgrade() -> None:
    inspector = sa.inspect(op.get_bind())
    if "medication_administrations" not in inspector.get_table_names():
        return

    status_column = next(
        column for column in inspector.get_columns("medication_administrations")
        if column["name"] == "status"
    )
    if isinstance(status_column["type"], sa.String) and status_column["type"].length == 6:
        with op.batch_alter_table("medication_administrations") as batch_op:
            batch_op.alter_column(
                "status",
                existing_type=sa.String(length=6),
                type_=sa.String(length=7),
                existing_nullable=False,
            )


def downgrade() -> None:
    inspector = sa.inspect(op.get_bind())
    if "medication_administrations" not in inspector.get_table_names():
        return

    statuses = {row[0] for row in op.get_bind().execute(sa.text("SELECT DISTINCT status FROM medication_administrations"))}
    if "REFUSED" in statuses:
        raise RuntimeError("Cannot downgrade while refused medication administrations exist.")

    status_column = next(
        column for column in inspector.get_columns("medication_administrations")
        if column["name"] == "status"
    )
    if isinstance(status_column["type"], sa.String) and status_column["type"].length == 7:
        with op.batch_alter_table("medication_administrations") as batch_op:
            batch_op.alter_column(
                "status",
                existing_type=sa.String(length=7),
                type_=sa.String(length=6),
                existing_nullable=False,
            )
