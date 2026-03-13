export { auth as middleware } from "@/auth";

export const config = {
  matcher: ["/dashboard/:path*", "/forms/:path*", "/api/ai/:path*"],
};
