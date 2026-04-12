# Reviewed: autogenerate produced the expected two-table schema.
# Dataset: UUID PK, unique slug, cell_count/gene_count as int.
# PrecomputeRun: UUID PK, dataset_id FK, JSON parameters, git_sha text.

"""init datasets and precompute_runs

Revision ID: 0001_init_datasets
Revises:
Create Date: 2026-04-12

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0001_init_datasets"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "datasets",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("slug", sa.String(length=64), nullable=False),
        sa.Column("display_name", sa.String(), nullable=False),
        sa.Column("citation", sa.String(), nullable=False),
        sa.Column("license", sa.String(), nullable=False),
        sa.Column("cell_count", sa.Integer(), nullable=False),
        sa.Column("gene_count", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_datasets_slug"), "datasets", ["slug"], unique=True)
    op.create_table(
        "precompute_runs",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("dataset_id", sa.Uuid(), nullable=False),
        sa.Column("model_name", sa.String(), nullable=False),
        sa.Column("model_version", sa.String(), nullable=False),
        sa.Column("parameters", sa.JSON(), nullable=False),
        sa.Column("output_parquet_key", sa.String(), nullable=False),
        sa.Column("git_sha", sa.String(length=40), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["dataset_id"],
            ["datasets.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_precompute_runs_dataset_id"),
        "precompute_runs",
        ["dataset_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_precompute_runs_dataset_id"), table_name="precompute_runs")
    op.drop_table("precompute_runs")
    op.drop_index(op.f("ix_datasets_slug"), table_name="datasets")
    op.drop_table("datasets")
