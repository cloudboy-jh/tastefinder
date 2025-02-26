import { NextResponse } from "next/server";
import OpenAI from "openai";

// Initialize the OpenAI client with proper configuration
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

export async function POST(request: Request) {
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Messages are required" },
        { status: 400 }
      );
    }

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key is not configured" },
        { status: 500 }
      );
    }

    // Add system message to guide the AI
    const systemMessage = {
      role: "system",
      content: `You are a helpful restaurant recommendation assistant named Taster. 

      When users ask about food or restaurants, respond with JSON format containing the essential details you can extract from their query.
      Keep it simple - if they only mention food and location, that's perfectly fine.
      
      Format your response as JSON with this structure:
      {
        "food": "type of food mentioned",
        "location": "location mentioned",
        "price": "$ to $$$$" (optional),
        "open_now": boolean (optional),
        "message": "a friendly response"
      }
      
      For general conversation (hi, hello, how are you), respond naturally without JSON.
      
      Examples:
      - "pizza in new york" → Extract just food and location
      - "expensive sushi in LA open now" → Include price and open_now
      - "hi" → Respond conversationally`
    };

    try {
      console.log("Calling OpenAI API with messages:", JSON.stringify(messages));
      
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [systemMessage, ...messages],
        temperature: 0.7,
      });
      
      console.log("OpenAI API response received:", JSON.stringify(response.choices[0].message));

      // Format the response to match what the client expects
      return NextResponse.json({
        choices: [
          {
            message: response.choices[0].message
          }
        ]
      });
    } catch (openaiError: any) {
      console.error("OpenAI API error:", openaiError);
      
      // Return a more detailed error message
      return NextResponse.json(
        { 
          error: "Error communicating with OpenAI API", 
          details: openaiError.message || "Unknown error"
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Error in chat API:", error);
    return NextResponse.json(
      { 
        error: "Failed to process chat request",
        details: error.message || "Unknown error"
      },
      { status: 500 }
    );
  }
}