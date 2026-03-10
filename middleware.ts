import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const res = NextResponse.next();

  // Ensure every visitor has a persistent guestId cookie
  if (!req.cookies.get("guestId")) {
    res.cookies.set("guestId", crypto.randomUUID(), {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });
  }

  return res;
});

export const config = {
  matcher: ["/train/:path*"],
};
