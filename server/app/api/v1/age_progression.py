import json
from datetime import datetime
from uuid import uuid4
from fastapi import APIRouter, File, UploadFile, Form, HTTPException, Body
from typing import Optional, List
from pydantic import BaseModel

from app.models.schemas import (
    AgeProgressionResponse, 
    AgeProgressionResult,
    ImageEditResponse,
    ImageEnhanceResponse,
    DescriptorResponse,
    ChildDescriptor
)
from app.services import gemini_service, image_utils

router = APIRouter(tags=["Age Progression"])

class DescribeRequest(BaseModel):
    text: str
    source_language: str = "auto"


@router.post("/age-progress", response_model=AgeProgressionResponse)
async def create_age_progression(
    file: UploadFile = File(...),
    current_age: int = Form(...),
    target_ages: str = Form(...),  # comma separated list, e.g., "12,14,16"
    gender: str = Form(...),
    description: str = Form(...),
    child_name: Optional[str] = Form(None)
):
    try:
        # Parse target ages
        target_ages_list = [int(age.strip()) for age in target_ages.split(",")]
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid target_ages format. Must be comma-separated integers.")

    # Read and validate image
    image_bytes = await file.read()
    try:
        image_bytes = image_utils.validate_and_resize(image_bytes)
        image_bytes = image_utils.convert_format(image_bytes, "JPEG")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    import asyncio

    async def _generate_one(t_age: int):
        for attempt in range(3):
            try:
                progressed_bytes = await gemini_service.age_progress(
                    image_bytes=image_bytes,
                    current_age=current_age,
                    target_age=t_age,
                    gender=gender,
                    description=description
                )
                filename = image_utils.save_output(progressed_bytes, prefix=f"age_{t_age}")
                return t_age, progressed_bytes, filename
            except Exception as e:
                if "429" in str(e) and attempt < 2:
                    await asyncio.sleep(5 * (attempt + 1))  # back off 5s, then 10s
                    continue
                raise HTTPException(status_code=500, detail=f"Failed to generate age {t_age}: {str(e)}")

    age_outputs = await asyncio.gather(*[_generate_one(t) for t in target_ages_list])

    results = []
    generated_images = []
    for t_age, img_bytes, filename in sorted(age_outputs, key=lambda x: x[0]):
        results.append(AgeProgressionResult(
            target_age=t_age,
            image_url=f"/outputs/{filename}",
            filename=filename
        ))
        generated_images.append(img_bytes)

    grid_url = None
    if generated_images:
        try:
            grid_bytes = image_utils.create_age_grid(generated_images, target_ages_list)
            grid_filename = image_utils.save_output(grid_bytes, prefix="grid")
            grid_url = f"/outputs/{grid_filename}"
        except Exception as e:
            # Non-fatal if grid fails
            print(f"Warning: Failed to create grid: {e}")

    return AgeProgressionResponse(
        request_id=uuid4().hex,
        child_name=child_name,
        current_age=current_age,
        results=results,
        grid_url=grid_url
    )


@router.post("/enhance", response_model=ImageEnhanceResponse)
async def enhance_photo(file: UploadFile = File(...)):
    image_bytes = await file.read()
    try:
        image_bytes = image_utils.validate_and_resize(image_bytes)
        image_bytes = image_utils.convert_format(image_bytes, "JPEG")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
        
    try:
        enhanced_bytes = await gemini_service.enhance_image(image_bytes)
        filename = image_utils.save_output(enhanced_bytes, prefix="enhanced")
        
        return ImageEnhanceResponse(
            request_id=uuid4().hex,
            enhanced_image_url=f"/outputs/{filename}",
            original_filename=file.filename
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to enhance image: {str(e)}")


@router.post("/edit", response_model=ImageEditResponse)
async def edit_photo(
    file: UploadFile = File(...),
    instruction: str = Form(...)
):
    image_bytes = await file.read()
    try:
        image_bytes = image_utils.validate_and_resize(image_bytes)
        image_bytes = image_utils.convert_format(image_bytes, "JPEG")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
        
    try:
        edited_bytes = await gemini_service.edit_image(image_bytes, instruction)
        filename = image_utils.save_output(edited_bytes, prefix="edited")
        
        return ImageEditResponse(
            request_id=uuid4().hex,
            edited_image_url=f"/outputs/{filename}",
            instruction_applied=instruction
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to edit image: {str(e)}")


@router.post("/describe", response_model=DescriptorResponse)
async def describe_child(request: DescribeRequest):
    try:
        extracted_data = await gemini_service.extract_description(
            text=request.text,
            source_language=request.source_language
        )
        
        # Ensure distinguishing_marks is a list
        marks = extracted_data.get("distinguishing_marks")
        if not marks:
             marks = None
        elif isinstance(marks, list):
             marks = ", ".join(marks)
             
        descriptor = ChildDescriptor(
            name=extracted_data.get("name"),
            age=extracted_data.get("age"),
            gender=extracted_data.get("gender"),
            height_cm=extracted_data.get("height_cm"),
            skin_tone=extracted_data.get("skin_tone"),
            clothing_description=extracted_data.get("clothing_last_seen"),
            distinguishing_marks=marks
        )
        
        return DescriptorResponse(
            request_id=uuid4().hex,
            descriptor=descriptor,
            source_language=request.source_language
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to extract description: {str(e)}")
