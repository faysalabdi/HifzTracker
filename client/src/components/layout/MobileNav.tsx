import { Link } from "wouter";
import { navItems } from "@/lib/constants";
import { X } from "lucide-react";

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  currentPath: string;
}

export default function MobileNav({ isOpen, onClose, currentPath }: MobileNavProps) {
  return (
    <div
      className={`md:hidden fixed right-0 top-0 bottom-0 w-64 bg-white z-50 shadow-lg transform transition-transform duration-200 ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`}
    >
      <div className="p-4 border-b border-neutral-100 flex justify-between items-center">
        <h2 className="font-heading font-semibold text-lg">Menu</h2>
        <button onClick={onClose} className="text-neutral-500">
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="p-4">
        {navItems.map((item) => (
          <Link key={item.name} href={item.path}>
            <a
              onClick={onClose}
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
      </div>
    </div>
  );
}
