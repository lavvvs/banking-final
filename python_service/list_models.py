import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv(dotenv_path="../.env")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    print("ERROR: GEMINI_API_KEY not found in .env file")
    exit(1)

print(f"API Key loaded: {GEMINI_API_KEY[:15]}...")

genai.configure(api_key=GEMINI_API_KEY)

print("\n=== Listing All Available Models ===\n")

try:
    models = genai.list_models()
    
    for model in models:
        print(f"Model Name: {model.name}")
        print(f"  Display Name: {model.display_name}")
        print(f"  Description: {model.description}")
        print(f"  Supported Methods: {model.supported_generation_methods}")
        print(f"  Input Token Limit: {getattr(model, 'input_token_limit', 'N/A')}")
        print(f"  Output Token Limit: {getattr(model, 'output_token_limit', 'N/A')}")
        print("-" * 80)
        
except Exception as e:
    print(f"ERROR listing models: {e}")
    print(f"Error type: {type(e).__name__}")