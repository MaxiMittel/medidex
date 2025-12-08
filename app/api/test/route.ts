import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "../../../lib/auth";

export async function GET(request: NextRequest) {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({
    headers: requestHeaders,
  });

  // Get JWT token by calling the token endpoint internally
  const baseUrl = process.env.BASE_URL || request.nextUrl.origin;
  let jwtToken = null;
  
  try {
    const tokenResponse = await fetch(`${baseUrl}/api/auth/token`, {
      headers: {
        cookie: requestHeaders.get("cookie") || "",
      },
    });

    if (tokenResponse.ok) {
      const tokenData = await tokenResponse.json();
      jwtToken = tokenData.token;
    }
  } catch (error) {
    console.error("Error fetching JWT token:", error);
  }

  return NextResponse.json({ 
    session,
    jwt: jwtToken
  });
}
