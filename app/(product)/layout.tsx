import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import "@/app/market-analyzer.css";

export default async function ProductLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const session = await getSession(cookieStore.get("cm_session")?.value);
  if (!session) {
    const pathname = (await headers()).get("x-pathname") ?? "/market-analyzer";
    redirect(`/login?from=${pathname}`);
  }

  return <>{children}</>;
}
