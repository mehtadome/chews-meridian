import { ThemeProvider } from "@/components/theme-provider";

export default function ProductLayout({ children }: { children: React.ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}
