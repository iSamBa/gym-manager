import { ReactNode } from "react";
import { Sidebar, MobileSidebar } from "./sidebar";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex h-screen">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:w-48 md:flex-col">
        <div className="bg-card flex flex-grow flex-col border-r">
          <Sidebar />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile menu trigger */}
        <div className="border-b p-4 md:hidden">
          <MobileSidebar />
        </div>

        <main className="bg-background flex-1 overflow-x-hidden overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
