import os
import json
import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv
import openai

# ✅ Load environment variables
load_dotenv()
api_key = os.getenv("OPENAI_API_KEY")

# ✅ Configure logging
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

# ✅ Validate API key
if not api_key:
    raise RuntimeError("🚨 ERROR: OPENAI_API_KEY is missing! Please check your .env file.")

# ✅ Set the API key for OpenAI
openai.api_key = api_key

# ✅ Define FastAPI Router
router = APIRouter()

# ✅ Define Asset Data Model
class AssetData(BaseModel):
    name: str
    model: str
    serial: str
    category: str
    hours: int
    cycles: int
    environment: str

@router.post("/generate_pm_plan")
async def generate_pm_plan(asset: AssetData):
    """
    Generates a Preventive Maintenance (PM) plan using OpenAI based on asset details.
    """
    try:
        # ✅ Log received asset data
        logger.info(f"📩 Received API request with asset data: {asset.dict()}")

        # ✅ Format asset details safely
        asset_data = {
            "name": asset.name,
            "model": asset.model,
            "serial": asset.serial,
            "category": asset.category,
            "hours": asset.hours,
            "cycles": asset.cycles,
            "environment": asset.environment,
        }

        # ✅ Construct prompt for OpenAI with updated instructions
        prompt = f"""
Create a detailed preventive maintenance plan for the following asset:

{json.dumps(asset_data, indent=2)}

Instructions:
- Provide a structured JSON output with a key "maintenance_plan" that contains an array of maintenance task objects.
- Each task object must include the following fields:
  - "task_name": a string representing the name of the maintenance task.
  - "maintenance_interval": a string that can be one of: "Daily", "Weekly", "Monthly", "Quarterly", "Annual".
  - "instructions": an array of step-by-step instructions (each as a string).
  - "reason": a string describing why the task is necessary.
  - "safety_precautions": a string listing any safety precautions.
  - "expected_duration": a string or number indicating the expected duration of the task.
  - "expected_cost": a string or number indicating the approximate cost.
  - "source_information": a string describing the source of the maintenance information.
- Do not include any additional commentary or explanation. Output only valid JSON.
"""

        # ✅ Call OpenAI API using the updated syntax
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",  # or "gpt-4-turbo" if you have access
            messages=[{"role": "system", "content": prompt}],
            temperature=0.7
        )

        # ✅ Extract AI-generated text
        pm_plan_text = response.choices[0].message.content.strip()

        # ✅ Validate JSON format
        try:
            pm_plan = json.loads(pm_plan_text)  # Ensure AI response is valid JSON
        except json.JSONDecodeError:
            logger.error("❌ AI response could not be parsed as JSON.")
            raise HTTPException(status_code=500, detail="AI response could not be parsed as JSON.")

        logger.info("✅ Successfully generated PM Plan")
        return {"success": True, "data": pm_plan}

    except openai.OpenAIError as oe:
        logger.error(f"❌ OpenAI API Error: {oe}")
        raise HTTPException(status_code=500, detail=f"OpenAI API Error: {str(oe)}")

    except Exception as e:
        logger.error(f"❌ Internal Server Error: {e}")
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")
