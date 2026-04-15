import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}
export function AppLayout({
  children,
  title,
  subtitle
}: AppLayoutProps) {
  return <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 flex flex-col">
          <div className="flex-1 p-6 pt-8">
            {title && <div className="mb-6">
                <h1 className="text-3xl font-bold font-heading text-foreground">{title}</h1>
                {subtitle}
              </div>}
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>;
}