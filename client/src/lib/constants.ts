import { 
  LayoutDashboard, 
  Users, 
  Plus, 
  BarChart, 
  Settings,
  TrendingUp
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
    name: "Progress",
    path: "/progress",
    icon: TrendingUp
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
  "Ta-Ha",
  "Al-Anbiya", 
  "Al-Hajj", 
  "Al-Mu'minun", 
  "An-Nur", 
  "Al-Furqan", 
  "Ash-Shu'ara", 
  "An-Naml", 
  "Al-Qasas", 
  "Al-Ankabut", 
  "Ar-Rum", 
  "Luqman", 
  "As-Sajda", 
  "Al-Ahzab", 
  "Saba", 
  "Fatir", 
  "Ya-Sin", 
  "As-Saffat", 
  "Sad", 
  "Az-Zumar", 
  "Ghafir", 
  "Fussilat", 
  "Ash-Shura", 
  "Az-Zukhruf", 
  "Ad-Dukhan", 
  "Al-Jathiya", 
  "Al-Ahqaf", 
  "Muhammad", 
  "Al-Fath", 
  "Al-Hujurat", 
  "Qaf", 
  "Adh-Dhariyat", 
  "At-Tur", 
  "An-Najm", 
  "Al-Qamar", 
  "Ar-Rahman", 
  "Al-Waqi'a", 
  "Al-Hadid", 
  "Al-Mujadila", 
  "Al-Hashr", 
  "Al-Mumtahina", 
  "As-Saff", 
  "Al-Jumu'a", 
  "Al-Munafiqun", 
  "At-Taghabun", 
  "At-Talaq", 
  "At-Tahrim", 
  "Al-Mulk", 
  "Al-Qalam", 
  "Al-Haaqqa", 
  "Al-Ma'arij", 
  "Nuh", 
  "Al-Jinn", 
  "Al-Muzzammil", 
  "Al-Muddathir", 
  "Al-Qiyama", 
  "Al-Insan", 
  "Al-Mursalat", 
  "An-Naba", 
  "An-Nazi'at", 
  "Abasa", 
  "At-Takwir", 
  "Al-Infitar", 
  "Al-Mutaffifin", 
  "Al-Inshiqaq", 
  "Al-Buruj", 
  "At-Tariq", 
  "Al-A'la", 
  "Al-Ghashiya", 
  "Al-Fajr", 
  "Al-Balad", 
  "Ash-Shams", 
  "Al-Lail", 
  "Ad-Duha", 
  "Ash-Sharh", 
  "At-Tin", 
  "Al-Alaq", 
  "Al-Qadr", 
  "Al-Bayyina", 
  "Az-Zalzala", 
  "Al-Adiyat", 
  "Al-Qari'a", 
  "At-Takathur", 
  "Al-Asr", 
  "Al-Humaza", 
  "Al-Fil", 
  "Quraish", 
  "Al-Ma'un", 
  "Al-Kawthar", 
  "Al-Kafirun", 
  "An-Nasr", 
  "Al-Masad", 
  "Al-Ikhlas", 
  "Al-Falaq", 
  "An-Nas"
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
