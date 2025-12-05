"""Quick test to check if the server can start"""
import sys
sys.path.insert(0, r"C:\toa\backend")

try:
    print("Testing imports...")
    from app.main import app
    print("✅ App imported successfully!")
    print(f"App: {app}")
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
