"""initial migration

Revision ID: ff0fe98cbfc6
Revises: 
Create Date: 2026-03-17 00:58:27.545565

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'ff0fe98cbfc6'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    """
    This initial migration was auto-generated with UUID casts, but this project
    uses string UUIDs (VARCHAR) for IDs in SQLite. Attempting to CAST existing
    string IDs to sa.UUID in batch_alter_table causes IntegrityError on SQLite.

    Keep this migration as a no-op baseline so future migrations can run.
    """
    pass


def downgrade():
    pass
