

# --- PLANT COUNTING ROUTES ---

class CountResponse(BaseModel):
    count: int
    centroids: List[tuple]
    annotated_image_url: Optional[str]
    image_width: int
    image_height: int
    color_type: str
    parameters: Dict[str, int]
    
    class Config:
        from_attributes = True

@app.post("/api/count-plants", response_model=CountResponse)
async def count_plants(
    file: UploadFile = File(...),
    color_type: str = 'green',
    min_area: int = 50,
    max_area: int = 5000,
    current_user: User = Depends(get_current_active_user)
):
    """
    Count microgreen plants in uploaded image
    
    Args:
        file: Image file (jpg, png)
        color_type: Microgreen color ('green', 'red', 'purple')
        min_area: Minimum plant area in pixels (default: 50)
        max_area: Maximum plant area in pixels (default: 5000)
    
    Returns:
        Count result with annotated image URL
    """
    # Validate file type
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    try:
        # Import count service
        from app.services.count_service import get_count_service
        
        # Read image bytes
        image_bytes = await file.read()
        
        # Process image
        count_service = get_count_service()
        result = count_service.count_from_bytes(
            image_bytes=image_bytes,
            color_type=color_type,
            min_area=min_area,
            max_area=max_area,
            save_annotated=True
        )
        
        return result
        
    except Exception as e:
        print(f"Error counting plants: {e}")
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")
