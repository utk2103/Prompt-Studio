"""Model catalog: live pricing / context window per model slug

Revision ID: 002
Revises: 001
Create Date: 2026-08-31
"""
from __future__ import annotations

import sqlalchemy as sa

from alembic import op

revision = "002"
down_revision = "001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "model_catalog",
        sa.Column("id", sa.String(50), primary_key=True),
        sa.Column("name", sa.String(120), nullable=False),
        sa.Column("provider", sa.String(60), nullable=False),
        sa.Column("context", sa.Integer, nullable=False),
        sa.Column("cost_in", sa.Float, nullable=False),
        sa.Column("cost_out", sa.Float, nullable=False),
        sa.Column("format", sa.String(60), nullable=False),
        sa.Column("litellm_key", sa.String(120), nullable=True),
        sa.Column("updated_at", sa.BigInteger, nullable=False),
    )


def downgrade() -> None:
    op.drop_table("model_catalog")
