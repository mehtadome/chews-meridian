import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import "@/app/pl.css";

export default async function PlLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const session = await getSession(cookieStore.get("cm_session")?.value);
  if (!session) redirect("/login");

  return <div className="pl-shell">{children}</div>;
}
