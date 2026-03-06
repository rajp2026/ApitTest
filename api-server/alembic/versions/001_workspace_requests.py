"""Add workspace_id to saved_requests and make collection_id nullable

Revision ID: 001_workspace_requests
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers
revision = '001_workspace_requests'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    # Add workspace_id column (nullable FK to workspaces)
    op.add_column('saved_requests', sa.Column('workspace_id', sa.Integer(), sa.ForeignKey('workspaces.id'), nullable=True))
    
    # Make collection_id nullable
    op.alter_column('saved_requests', 'collection_id', existing_type=sa.Integer(), nullable=True)

def downgrade():
    op.alter_column('saved_requests', 'collection_id', existing_type=sa.Integer(), nullable=False)
    op.drop_column('saved_requests', 'workspace_id')
