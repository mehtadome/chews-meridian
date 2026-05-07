import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ThemeProvider } from "@/components/theme-provider";
import { getSession } from "@/lib/auth";

export default async function ProductLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const session = await getSession(cookieStore.get("cm_session")?.value);
  if (!session) redirect("/login");

  return <ThemeProvider>{children}</ThemeProvider>;
}
