import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/navigation/bottom-nav";

export default function FrontendLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <Header />
      <main className="flex flex-1 flex-col pb-16 md:pb-0">{children}</main>
      <Footer />
      <BottomNav />
    </>
  );
}
