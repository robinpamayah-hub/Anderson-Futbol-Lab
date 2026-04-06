import { PortalNav } from "@/components/layout/PortalNav";

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <PortalNav />
      <main className="flex-1">
        <div className="max-w-5xl mx-auto p-4 md:p-6">{children}</div>
      </main>
    </div>
  );
}
