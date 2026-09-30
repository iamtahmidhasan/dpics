import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";

export default function FrontendLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <Header />
      <main className="flex flex-1 flex-col">{children}</main>
      <Footer />
    </>
  );
}
