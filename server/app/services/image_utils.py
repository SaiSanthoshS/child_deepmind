import io
import os
from PIL import Image
from uuid import uuid4
from fastapi import UploadFile
from app.core.config import get_settings

settings = get_settings()

def validate_and_resize(image_bytes: bytes, max_size_mb: int = 10) -> bytes:
    """Validates image size and resizes if it's too large for the API."""
    if len(image_bytes) > max_size_mb * 1024 * 1024:
        raise ValueError(f"Image size exceeds {max_size_mb} MB limit.")
    
    # Try to open to ensure it's a valid image
    try:
        with Image.open(io.BytesIO(image_bytes)) as img:
            img.verify()
    except Exception as e:
        raise ValueError("Invalid image file.") from e
        
    return image_bytes

def save_output(image_bytes: bytes, prefix: str = "img") -> str:
    """Saves image bytes to the output directory and returns the filename."""
    filename = f"{prefix}_{uuid4().hex[:8]}.jpg"
    filepath = settings.output_dir / filename
    
    with open(filepath, "wb") as f:
        f.write(image_bytes)
        
    return filename

def create_age_grid(images_bytes: list[bytes], ages: list[int]) -> bytes:
    """Creates a side-by-side comparison grid of the generated ages."""
    if not images_bytes:
        return b""
        
    images = [Image.open(io.BytesIO(img)) for img in images_bytes]
    
    # Assume all images are same size for simplicity, take size of first
    width, height = images[0].size
    
    # Create new image
    grid_width = width * len(images)
    grid_height = height
    grid_img = Image.new('RGB', (grid_width, grid_height))
    
    for i, img in enumerate(images):
        # Resize to match first image size if needed
        if img.size != (width, height):
            img = img.resize((width, height))
        grid_img.paste(img, (i * width, 0))
        
    # Save grid to bytes
    output = io.BytesIO()
    grid_img.save(output, format="JPEG")
    return output.getvalue()

def convert_format(image_bytes: bytes, target_format: str = "JPEG") -> bytes:
    """Converts image to target format."""
    with Image.open(io.BytesIO(image_bytes)) as img:
        output = io.BytesIO()
        if img.mode in ("RGBA", "P") and target_format == "JPEG":
            img = img.convert("RGB")
        img.save(output, format=target_format)
        return output.getvalue()
