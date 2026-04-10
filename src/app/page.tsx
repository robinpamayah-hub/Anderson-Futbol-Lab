export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";

export default function Home() {
  // Middleware handles redirecting to /login, /admin, or /portal
  redirect("/login");
}
