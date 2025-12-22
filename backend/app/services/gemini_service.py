"""
Service for generating AI growth suggestions using Google Gemini
"""
import os
import json
try:
    import google.generativeai as genai
    HAS_GEMINI = True
except ImportError:
    HAS_GEMINI = False

# Configure API key if available
API_KEY = "AIzaSyCrdWlHIJfXXWhO3qYu1pZ2AMoB2-LOksc"
if HAS_GEMINI and API_KEY:
    genai.configure(api_key=API_KEY)

def get_growth_suggestion(crop, logs):
    """
    Generate growth advice based on crop status and recent logs.
    """
    if not HAS_GEMINI or not API_KEY:
        return {
            "suggestion": "AI suggestions are unavailable. Please set GEMINI_API_KEY and install google-generativeai.",
            "status": "warning"
        }

    try:
        # Define candidate models to try in order of preference
        # Based on debugging, we need to handle potential 404s on aliases
        candidates = [
            'gemini-1.5-flash', 
            'gemini-1.5-flash-latest',
            'gemini-pro', 
            'models/gemini-1.5-flash'
        ]
        
        response = None
        last_error = None
        
        # Construct prompt once
        # Construct context
        seed_name = crop.seed.name
        current_day = len(logs) // crop.watering_frequency # Approximation
        
        recent_logs_text = ""
        for log in logs[-3:]: # Last 3 logs
            recent_logs_text += f"Day {log.day_number}: Temp {log.temperature}C, Hum {log.humidity}%, Watered: {log.watered}\n"
            
        prompt = f"""
        I am growing {seed_name} microgreens. 
        Current progress: Day {current_day} of {crop.seed.harvest_days if crop.seed.harvest_days else 'standard cycle'}.
        Recent conditions:
        {recent_logs_text}
        
        The ideal temperature is {crop.seed.ideal_temp}C and humidity {crop.seed.ideal_humidity}%.
        
        Analyze the conditions. If they are off, warn me. 
        Give me 2-3 short, actionable tips for the next 24 hours to maximize yield.
        Keep it encouraging but technical.
        """

        # Try models sequentially
        rate_limited_error = None
        
        for model_name in candidates:
            try:
                model = genai.GenerativeModel(model_name)
                response = model.generate_content(prompt)
                if response:
                    break
            except Exception as e:
                # Capture the most "useful" error
                if "429" in str(e):
                    rate_limited_error = e
                last_error = e
                print(f"Failed with {model_name}: {e}")
                continue
        
        if not response:
            # If we hit a rate limit on ANY valid model, report that instead of a 404 from a backup model
            final_error = rate_limited_error if rate_limited_error else last_error
            raise final_error if final_error else Exception("No suitable AI model found")

        return {
            "suggestion": response.text,
            "status": "success"
        }
    except Exception as e:
        error_msg = str(e)
        if "429" in error_msg:
            suggestion = "AI Growth Coach is currently busy (Rate Limit). Please try again in a minute."
        elif "404" in error_msg:
            suggestion = "AI Model not available. Please check your API key permissions."
        else:
            print(f"Gemini API Error: {e}")
            suggestion = "Unable to reach AI Growth Coach. Please ensure your internet connection is stable."
            
        return {
            "suggestion": suggestion,
            "status": "error"
        }


