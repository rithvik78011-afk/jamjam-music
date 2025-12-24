# Save this as backend/check_models.py
from google import genai
from dotenv import load_dotenv
import os

load_dotenv()
client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))

print("--- AVAILABLE MODELS FOR YOUR KEY ---")
try:
    # This asks the server for the exact list
    for model in client.models.list():
        if "generateContent" in model.supported_actions:
            print(f"Name: {model.name}")
except Exception as e:
    print(f"Error: {e}")