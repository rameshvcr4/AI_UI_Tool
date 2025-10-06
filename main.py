from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

# Allow React frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class GenerateRequest(BaseModel):
    prompt: str

@app.get("/")
def root():
    return {"message": "Welcome to your Offline AI UI Tool!"}

@app.post("/generate-ui")
def generate_ui(request: GenerateRequest):
    prompt = request.prompt.strip().lower()

    if not prompt:
        raise HTTPException(status_code=400, detail="Prompt cannot be empty")

    # Simple offline demo rule-based UI generator
    if "login" in prompt:
        demo_code = """
        <div class="flex justify-center items-center h-screen bg-gradient-to-r from-indigo-400 to-blue-500">
            <form class="bg-white p-8 rounded-lg shadow-md w-80">
                <h2 class="text-2xl font-semibold mb-4 text-center text-gray-700">Login</h2>
                <input class="border p-2 w-full mb-4 rounded" placeholder="Email" />
                <input class="border p-2 w-full mb-4 rounded" type="password" placeholder="Password" />
                <button class="bg-blue-500 text-white p-2 w-full rounded hover:bg-blue-600">Login</button>
            </form>
        </div>
        """
    elif "signup" in prompt or "register" in prompt:
        demo_code = """
        <div class="flex justify-center items-center h-screen bg-gradient-to-r from-green-400 to-blue-500">
            <form class="bg-white p-8 rounded-lg shadow-md w-96">
                <h2 class="text-2xl font-semibold mb-4 text-center text-gray-700">Sign Up</h2>
                <input class="border p-2 w-full mb-4 rounded" placeholder="Name" />
                <input class="border p-2 w-full mb-4 rounded" placeholder="Email" />
                <input class="border p-2 w-full mb-4 rounded" type="password" placeholder="Password" />
                <button class="bg-green-500 text-white p-2 w-full rounded hover:bg-green-600">Create Account</button>
            </form>
        </div>
        """
    elif "dashboard" in prompt:
        demo_code = """
        <div class="min-h-screen bg-gray-100 p-8">
            <nav class="bg-white shadow-md p-4 mb-6 flex justify-between items-center">
                <h1 class="text-xl font-semibold text-gray-800">My Dashboard</h1>
                <button class="bg-blue-500 text-white px-4 py-2 rounded">Logout</button>
            </nav>
            <div class="grid grid-cols-3 gap-4">
                <div class="bg-white p-6 rounded shadow text-center">Profile</div>
                <div class="bg-white p-6 rounded shadow text-center">Analytics</div>
                <div class="bg-white p-6 rounded shadow text-center">Settings</div>
            </div>
        </div>
        """
    else:
        demo_code = f"""
        <div class="flex flex-col justify-center items-center h-screen bg-gray-200">
            <h2 class="text-3xl font-bold mb-4">Generated Demo UI</h2>
            <p class="text-gray-600">Your prompt: <b>{prompt}</b></p>
            <button class="mt-6 bg-indigo-500 text-white px-6 py-2 rounded-lg shadow hover:bg-indigo-600">
                Example Button
            </button>
        </div>
        """

    return {"ui_code": demo_code.strip()}
