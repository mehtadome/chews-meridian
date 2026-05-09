import { NextRequest, NextResponse } from "next/server";

const PROTECTED = ["/market-analyzer", "/pl-tracker", "/settings"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isProtected = PROTECTED.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (!isProtected) return NextResponse.next();

  const session = req.cookies.get("cm_session");
  if (!session) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?from=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/market-analyzer/:path*", "/pl-tracker/:path*", "/settings/:path*"],
};
