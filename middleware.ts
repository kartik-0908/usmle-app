import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export async function middleware(request: NextRequest) {
  const sessionCookie = getSessionCookie(request, {
    cookiePrefix: "mak",
  });

  // THIS IS NOT SECURE!
  // This is the recommended approach to optimistically redirect users
  // We recommend handling auth checks in each page/route
  if (!sessionCookie) {
    console.log("No session cookie found, redirecting to login");
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }
  const { pathname } = request.nextUrl
  console.log("Current pathname:", pathname);
  if(pathname === '/'){
    console.log("Redirecting from root to dashboard");
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard"], // Specify the routes the middleware applies to
};
