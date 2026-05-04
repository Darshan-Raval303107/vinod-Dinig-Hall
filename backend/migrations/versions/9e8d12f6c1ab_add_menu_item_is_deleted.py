"""add menu item is_deleted flag

Revision ID: 9e8d12f6c1ab
Revises: d7f41fdbc73c
Create Date: 2026-05-04
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "9e8d12f6c1ab"
down_revision = "d7f41fdbc73c"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("menu_items", schema=None) as batch_op:
        batch_op.add_column(
            sa.Column("is_deleted", sa.Boolean(), nullable=False, server_default=sa.text("0"))
        )


def downgrade():
    with op.batch_alter_table("menu_items", schema=None) as batch_op:
        batch_op.drop_column("is_deleted")
