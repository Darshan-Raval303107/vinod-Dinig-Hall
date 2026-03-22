"""add pickup_code for window orders

Revision ID: d7f41fdbc73c
Revises: a3ed10cfd01b
Create Date: 2026-03-22 11:35:16.966015

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'd7f41fdbc73c'
down_revision = 'a3ed10cfd01b'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('orders', sa.Column('pickup_code', sa.String(4), nullable=True))
    op.add_column('orders', sa.Column('order_type', sa.String(20), nullable=True, server_default='table'))
    op.add_column('orders', sa.Column('pickup_code_generated_at', sa.DateTime(), nullable=True))
    op.add_column('orders', sa.Column('pickup_code_used_at', sa.DateTime(), nullable=True))
    op.add_column('orders', sa.Column('customer_name', sa.String(255), nullable=True))
    
    op.alter_column('orders', 'table_number', existing_type=sa.INTEGER(), nullable=True)

    op.execute("""
        CREATE UNIQUE INDEX IF NOT EXISTS idx_active_window_pickup_code 
        ON orders (pickup_code) 
        WHERE order_type = 'window' 
          AND status NOT IN ('completed', 'cancelled', 'picked_up', 'delivered');
    """)


def downgrade():
    op.execute("DROP INDEX IF EXISTS idx_active_window_pickup_code")
    op.alter_column('orders', 'table_number', existing_type=sa.INTEGER(), nullable=False)
    op.drop_column('orders', 'customer_name')
    op.drop_column('orders', 'pickup_code_used_at')
    op.drop_column('orders', 'pickup_code_generated_at')
    op.drop_column('orders', 'order_type')
    op.drop_column('orders', 'pickup_code')
