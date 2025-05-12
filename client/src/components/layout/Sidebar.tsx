import { Link } from "wouter";
import { BookOpen } from "lucide-react";
import { navItems } from "@/lib/constants";

interface SidebarProps {
  currentPath: string;
}

export default function Sidebar({ currentPath }: SidebarProps) {
  return (
    <aside className="hidden md:block w-64 bg-white border-r border-neutral-100 h-screen fixed">
      <div className="p-5 border-b border-neutral-100">
        <div className="flex items-center gap-2">
          <BookOpen className="text-primary-500 h-6 w-6" />
          <h1 className="font-heading font-semibold text-xl text-primary-500">Hifz Tracker</h1>
        </div>
      </div>
      <nav className="p-3">
        {navItems.map((item) => (
          <Link key={item.name} href={item.path}>
            <a
              className={`flex items-center gap-3 p-3 rounded-lg mb-1 cursor-pointer transition-colors ${
                currentPath === item.path
                  ? "bg-primary-50 text-primary-500"
                  : "text-neutral-600 hover:bg-neutral-50"
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span className="font-medium">{item.name}</span>
            </a>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
