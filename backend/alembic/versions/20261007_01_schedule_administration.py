from alembic import op
import sqlalchemy as sa


revision = "20261007_01"
down_revision = "20261006_01"
branch_labels = None
depends_on = None


def upgrade() -> None:
    inspector = sa.inspect(op.get_bind())
    if "medication_administrations" not in inspector.get_table_names():
        return

    columns = {column["name"] for column in inspector.get_columns("medication_administrations")}
    if "schedule_id" in columns:
        return
    with op.batch_alter_table("medication_administrations") as batch_op:
        batch_op.add_column(sa.Column("schedule_id", sa.Integer(), nullable=True))
        batch_op.create_foreign_key(
            "fk_medication_administrations_schedule_id_medication_schedules",
            "medication_schedules",
            ["schedule_id"],
            ["id"],
        )


def downgrade() -> None:
    inspector = sa.inspect(op.get_bind())
    if "medication_administrations" not in inspector.get_table_names():
        return

    columns = {column["name"] for column in inspector.get_columns("medication_administrations")}
    if "schedule_id" not in columns:
        return

    if "schedule_id" not in columns:
        return
    with op.batch_alter_table("medication_administrations") as batch_op:
        batch_op.drop_constraint(
            "fk_medication_administrations_schedule_id_medication_schedules",
            type_="foreignkey",
        )
        batch_op.drop_column("schedule_id")
