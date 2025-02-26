import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
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
      content: `You are a helpful restaurant recommendation assistant. 
      Extract the following information from the user's query:
      - Type of food/cuisine they're looking for
      - Location they want to search in
      - Price range ($ for budget, $$ for moderate, $$$ for expensive, $$$$ for very expensive)
      - Whether they want places that are open now
      - Any specific requirements (dietary restrictions, atmosphere, etc.)
      
      Format your response as JSON with the following structure:
      {
        "food": "extracted food type or cuisine",
        "location": "extracted location",
        "price": "extracted price range (1-4 dollar signs)",
        "open_now": boolean,
        "message": "a friendly response to the user"
      }
      
      If any information is missing, make a reasonable assumption based on the query.`
    };

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [systemMessage, ...messages],
      temperature: 0.7,
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error in chat API:", error);
    return NextResponse.json(
      { error: "Failed to process chat request" },
      { status: 500 }
    );
  }
}