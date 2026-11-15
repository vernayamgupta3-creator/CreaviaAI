import os
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from openai import OpenAI


# Load .env from the main Creavia folder
BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

app = FastAPI(title="Creavia API")


# Frontend connection
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Groq configuration
api_key = os.getenv("GROQ_API_KEY")

if not api_key:
    raise RuntimeError("GROQ_API_KEY is missing from .env")

client = OpenAI(
    api_key=api_key,
    base_url="https://api.groq.com/openai/v1"
)

MODEL = "openai/gpt-oss-20b"


from typing import Literal
from pydantic import Field


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    message: str
    history: list[ChatMessage] = Field(default_factory=list)


@app.get("/")
def home():
    return {"status": "Creavia AI is running"}


@app.post("/chat")
def chat(request: ChatRequest):

    message = request.message.strip()

    if not message:
        return {"reply": "Please enter a question."}

    try:
        response = client.chat.completions.create(
            model=MODEL,
            messages=[
    {
        "role": "system",
        "content": """
        You are Creavia, an intelligent AI study assistant.

        Your purpose is to help students understand concepts,
        prepare for examinations and improve their learning.

        Explain difficult concepts in simple language.
        Give structured and accurate answers.
        Use examples wherever useful.
        Encourage conceptual understanding.
        Be supportive and professional.
        Avoid unnecessary lengthy explanations.

        Remember the context of the ongoing conversation.
        Understand follow-up questions using previous messages.
        """
    },
    *[
        {
            "role": item.role,
            "content": item.content
        }
        for item in request.history
    ],
    {
        "role": "user",
        "content": message
    }
]
        )

        answer = response.choices[0].message.content

        return {"reply": answer}

    except Exception as error:
        print("Groq error:", error)

        raise HTTPException(
            status_code=500,
            detail="Creavia could not generate a response."
        )