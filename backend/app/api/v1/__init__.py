# v1 API package: aggregated router is defined here for mounting under /api/v1.

from fastapi import APIRouter

from app.api.v1 import disagreement, embeddings, scores, summary

router = APIRouter()
router.include_router(embeddings.router)
router.include_router(scores.router)
router.include_router(disagreement.router)
router.include_router(summary.router)
