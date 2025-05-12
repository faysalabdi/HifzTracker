import { useState } from "react";
import { useLocation } from "wouter";
import Sidebar from "./Sidebar";
import MobileNav from "./MobileNav";
import { BookOpen } from "lucide-react";

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [location] = useLocation();

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-800 font-sans">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-neutral-100 fixed top-0 left-0 right-0 z-30">
        <div className="flex items-center gap-2">
          <BookOpen className="text-primary-500 h-6 w-6" />
          <h1 className="font-heading font-semibold text-lg text-primary-500">Hifz Tracker</h1>
        </div>
        <button onClick={toggleMobileMenu} className="text-neutral-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          onClick={closeMobileMenu} 
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-200"
        />
      )}

      {/* Mobile Menu */}
      <MobileNav isOpen={mobileMenuOpen} onClose={closeMobileMenu} currentPath={location} />

      <div className="flex h-screen md:pt-0 pt-14">
        {/* Sidebar (desktop only) */}
        <Sidebar currentPath={location} />

        {/* Main content area */}
        <main className="flex-1 md:ml-64 overflow-y-auto h-screen pb-16 md:pb-0">
          {children}
        </main>
      </div>
    </div>
  );
}
