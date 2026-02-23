import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message } = body;

    if (!message) {
      return NextResponse.json(
        { response: "Message is required" },
        { status: 400 }
      );
    }

    // Determine the Python backend URL
    const pythonBackendUrl =
      process.env.NODE_ENV === "production"
        ? "/api/index.py"
        : "http://127.0.0.1:8000";

    // Forward the request to the Python backend
    const response = await fetch(`${pythonBackendUrl}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Python backend error:", response.status, errorText);
      return NextResponse.json(
        {
          response: "Sorry, the AI service is currently unavailable. Please ensure the Python backend is running.",
        },
        { status: 503 }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in chat API route:", error);
    
    // Check if it's a connection error
    if (error instanceof TypeError && error.message.includes("fetch")) {
      return NextResponse.json(
        {
          response: "Cannot connect to AI service. Please ensure the Python backend is running on port 8000.",
        },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      {
        response: "Sorry, I encountered an error. Please try again.",
      },
      { status: 500 }
    );
  }
}
