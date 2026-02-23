import os
from dotenv import load_dotenv
import google.generativeai as genai

# Load environment variables
load_dotenv(dotenv_path="../.env")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
print(f"API Key loaded: {GEMINI_API_KEY[:20]}..." if GEMINI_API_KEY else "No API key found")

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    
    # Try the simplest possible approach
    models_to_try = [
        "gemini-pro",
        "gemini-1.5-flash",
        "gemini-1.5-pro",
        "models/gemini-pro",
        "models/gemini-1.5-flash"
    ]
    
    for model_name in models_to_try:
        try:
            print(f"\n=== Testing {model_name} ===")
            # Simplest possible configuration
            model = genai.GenerativeModel(model_name)
            response = model.generate_content("Say 'test successful'")
            print(f"✓ SUCCESS with {model_name}")
            print(f"Response: {response.text}")
            break
        except Exception as e:
            print(f"✗ FAILED with {model_name}")
            print(f"Error: {str(e)[:200]}")
else:
    print("ERROR: No GEMINI_API_KEY found")
