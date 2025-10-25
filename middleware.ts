import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const stage = process.env.STAGE!;
  const cookie = request.cookies.get(
    stage === "local"
      ? "better-auth.session_token"
      : "__Secure-better-auth.session_token"
  );

  if (!cookie || !cookie.value) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|images|favicon.ico|login|register).*)",
  ],
};
