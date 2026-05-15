import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import "@/app/market-analyzer.css";

export default async function ProductLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const session = await getSession(cookieStore.get("cm_session")?.value);
  if (!session) redirect("/login?from=/market-analyzer");

  return <>{children}</>;
}
