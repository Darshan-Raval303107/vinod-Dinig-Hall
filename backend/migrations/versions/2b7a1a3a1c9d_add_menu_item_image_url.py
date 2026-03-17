"""add menu item image url

Revision ID: 2b7a1a3a1c9d
Revises: ff0fe98cbfc6
Create Date: 2026-03-17
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "2b7a1a3a1c9d"
down_revision = "ff0fe98cbfc6"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("menu_items", schema=None) as batch_op:
        batch_op.add_column(sa.Column("image_url", sa.Text(), nullable=True))


def downgrade():
    with op.batch_alter_table("menu_items", schema=None) as batch_op:
        batch_op.drop_column("image_url")


