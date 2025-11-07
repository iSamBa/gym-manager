import { ReactNode } from "react";
import { Sidebar, MobileSidebar } from "./sidebar";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex h-screen overflow-x-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:w-56 md:flex-shrink-0 md:flex-col">
        <div className="bg-card sticky top-0 flex h-screen flex-col border-r">
          <Sidebar />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        {/* Mobile menu trigger */}
        <div className="border-b p-4 md:hidden">
          <MobileSidebar />
        </div>

        <main className="bg-background flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
