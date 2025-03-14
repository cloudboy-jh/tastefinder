import { NextResponse } from "next/server";
import { YelpResponse } from "@/lib/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const food = searchParams.get("food");
  const location = searchParams.get("location");
  const price = searchParams.get("price");
  const openNow = searchParams.get("open_now");
  const radius = searchParams.get("radius");

  console.log("API Request params:", { food, location, price, openNow, radius });

  if (!food || !location) {
    return NextResponse.json(
      { error: "Food preference and location are required" },
      { status: 400 }
    );
  }

  // You would normally store this in an environment variable
  const YELP_API_KEY = process.env.YELP_API_KEY;

  if (!YELP_API_KEY) {
    console.error("Yelp API key is not configured");
    return NextResponse.json(
      { error: "Yelp API key is not configured" },
      { status: 500 }
    );
  }

  try {
    // Build the query URL with all parameters
    let queryUrl = `https://api.yelp.com/v3/businesses/search?term=${encodeURIComponent(
      food
    )}&location=${encodeURIComponent(location)}&limit=5&sort_by=rating`;
    
    // Add optional parameters if they exist
    if (price) {
      // Convert price string like "$" or "$$" to Yelp's format "1" or "1,2"
      const priceParam = price.split('').map((_, i) => i + 1).join(',');
      queryUrl += `&price=${priceParam}`;
    }
    
    if (openNow === 'true') {
      queryUrl += '&open_now=true';
    }
    
    if (radius) {
      // Convert to meters if needed (Yelp uses meters)
      queryUrl += `&radius=${radius}`;
    }

    console.log("Calling Yelp API:", queryUrl);

    const response = await fetch(
      queryUrl,
      {
        headers: {
          Authorization: `Bearer ${YELP_API_KEY}`,
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Yelp API error (${response.status}):`, errorText);
      throw new Error(`Yelp API responded with status: ${response.status} - ${errorText}`);
    }

    const data: YelpResponse = await response.json();
    console.log("Yelp API response received with", data.businesses?.length || 0, "businesses");
    
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching from Yelp API:", error);
    return NextResponse.json(
      { error: "Failed to fetch restaurant data", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}