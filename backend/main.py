import logging
import sys
import os

# Ensure the current directory is on sys.path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from api.generate_pm_plan import router as pm_router
from routes.auth_routes import router as auth_router
from database import get_assets

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

app = FastAPI()

# Include routers
app.include_router(pm_router, prefix="/api")
app.include_router(auth_router, prefix="/auth")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Update for production with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logger.info("🚀 FastAPI Server is Starting...")

# Optionally, add a root endpoint for testing
@app.get("/")
async def root():
    return {"message": "FastAPI backend is running!"}
