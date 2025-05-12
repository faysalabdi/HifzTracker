import { 
  LayoutDashboard, 
  Users, 
  Plus, 
  BarChart, 
  Settings 
} from "lucide-react";

export const navItems = [
  {
    name: "Dashboard",
    path: "/",
    icon: LayoutDashboard
  },
  {
    name: "Students",
    path: "/students",
    icon: Users
  },
  {
    name: "New Session",
    path: "/new-session",
    icon: Plus
  },
  {
    name: "Reports",
    path: "/reports",
    icon: BarChart
  },
  {
    name: "Settings",
    path: "/settings",
    icon: Settings
  }
];

export const mistakeTypes = [
  { value: "tajweed", label: "Tajweed Error", color: "bg-error text-error" },
  { value: "word", label: "Word Mistake", color: "bg-warning text-warning" },
  { value: "stuck", label: "Stuck", color: "bg-accent-500 text-accent-600" }
];

export const grades = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];

export const surahs = [
  "Al-Fatihah", 
  "Al-Baqarah", 
  "Al-Imran", 
  "An-Nisa", 
  "Al-Ma'idah", 
  "Al-An'am", 
  "Al-A'raf", 
  "Al-Anfal", 
  "At-Tawbah", 
  "Yunus", 
  "Hud", 
  "Yusuf", 
  "Ar-Ra'd", 
  "Ibrahim", 
  "Al-Hijr", 
  "An-Nahl", 
  "Al-Isra", 
  "Al-Kahf", 
  "Maryam", 
  "Ta-Ha"
];

export const juzs = Array.from({ length: 30 }, (_, i) => i + 1);

export const getMistakeTypeColor = (type: string) => {
  const mistakeType = mistakeTypes.find(m => m.value === type);
  return mistakeType?.color || "bg-neutral-200 text-neutral-600";
};

export const getMistakeTypeLabel = (type: string) => {
  const mistakeType = mistakeTypes.find(m => m.value === type);
  return mistakeType?.label || "Unknown";
};

export const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase();
};

export const formatDate = (date: Date | string) => {
  const d = new Date(date);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  // Check if it's today
  if (d.toDateString() === now.toDateString()) {
    return `Today, ${d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
  }
  
  // Check if it's yesterday
  if (d.toDateString() === yesterday.toDateString()) {
    return `Yesterday, ${d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
  }
  
  // Otherwise, return the date
  return d.toLocaleDateString([], { 
    month: 'short', 
    day: 'numeric',
    year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
};
