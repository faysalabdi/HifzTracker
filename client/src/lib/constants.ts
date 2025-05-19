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
    name: "New Revision Session",
    path: "/new-session",
    icon: Plus
  },
  // {
  //   name: "Progress",
  //   path: "/progress",
  //   icon: TrendingUp
  // },
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

export const mistakeTypes = ["tajweed", "word", "stuck"] as const;

export const mistakeTypeInfo = [
  { value: "tajweed", label: "Tajweed Error", color: "#ef4444" },
  { value: "word", label: "Word Mistake", color: "#f59e0b" },
  { value: "stuck", label: "Stuck", color: "#8b5cf6" }
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

// Information about which surahs are in which juz
export const surahJuzMapping = {
  "Al-Fatihah": 1,
  "Al-Baqarah": [1, 2, 3],
  "Al-Imran": [3, 4],
  "An-Nisa": [4, 5, 6],
  "Al-Ma'idah": [6, 7],
  "Al-An'am": [7, 8],
  "Al-A'raf": [8, 9],
  "Al-Anfal": [9, 10],
  "At-Tawbah": [10, 11],
  "Yunus": 11,
  "Hud": [11, 12],
  "Yusuf": [12, 13],
  "Ar-Ra'd": 13,
  "Ibrahim": 13,
  "Al-Hijr": [13, 14],
  "An-Nahl": [14, 15],
  "Al-Isra": [15, 16],
  "Al-Kahf": [15, 16],
  "Maryam": 16,
  "Ta-Ha": [16, 17],
  "Al-Anbiya": 17,
  "Al-Hajj": [17, 18],
  "Al-Mu'minun": 18,
  "An-Nur": 18,
  "Al-Furqan": [18, 19],
  "Ash-Shu'ara": 19,
  "An-Naml": [19, 20],
  "Al-Qasas": [20],
  "Al-Ankabut": [20, 21],
  "Ar-Rum": 21,
  "Luqman": 21,
  "As-Sajdah": 21,
  "Al-Ahzab": [21, 22],
  "Saba": 22,
  "Fatir": 22,
  "Ya-Sin": [22, 23],
  "As-Saffat": 23,
  "Sad": 23,
  "Az-Zumar": [23, 24],
  "Ghafir": 24,
  "Fussilat": 24,
  "Ash-Shura": [24, 25],
  "Az-Zukhruf": 25,
  "Ad-Dukhan": 25,
  "Al-Jathiyah": 25,
  "Al-Ahqaf": [25, 26],
  "Muhammad": 26,
  "Al-Fath": 26,
  "Al-Hujurat": 26,
  "Qaf": [26, 27],
  "Adh-Dhariyat": 27,
  "At-Tur": 27,
  "An-Najm": 27,
  "Al-Qamar": 27,
  "Ar-Rahman": 27,
  "Al-Waqi'ah": 27,
  "Al-Hadid": [27, 28],
  "Al-Mujadila": 28,
  "Al-Hashr": 28,
  "Al-Mumtahanah": 28,
  "As-Saff": 28,
  "Al-Jumu'ah": 28,
  "Al-Munafiqun": 28,
  "At-Taghabun": 28,
  "At-Talaq": 28,
  "At-Tahrim": 28,
  "Al-Mulk": 29,
  "Al-Qalam": 29,
  "Al-Haqqah": 29,
  "Al-Ma'arij": 29,
  "Nuh": 29,
  "Al-Jinn": 29,
  "Al-Muzzammil": 29,
  "Al-Muddathir": 29,
  "Al-Qiyamah": 29,
  "Al-Insan": 29,
  "Al-Mursalat": 29,
  "An-Naba": 30,
  "An-Nazi'at": 30,
  "Abasa": 30,
  "At-Takwir": 30,
  "Al-Infitar": 30,
  "Al-Mutaffifin": 30,
  "Al-Inshiqaq": 30,
  "Al-Buruj": 30,
  "At-Tariq": 30,
  "Al-A'la": 30,
  "Al-Ghashiyah": 30,
  "Al-Fajr": 30,
  "Al-Balad": 30,
  "Ash-Shams": 30,
  "Al-Lail": 30,
  "Ad-Duha": 30,
  "Ash-Sharh": 30,
  "At-Tin": 30,
  "Al-Alaq": 30,
  "Al-Qadr": 30,
  "Al-Bayyinah": 30,
  "Az-Zalzalah": 30,
  "Al-Adiyat": 30,
  "Al-Qari'ah": 30,
  "At-Takathur": 30,
  "Al-Asr": 30,
  "Al-Humazah": 30,
  "Al-Fil": 30,
  "Quraish": 30,
  "Al-Ma'un": 30,
  "Al-Kawthar": 30,
  "Al-Kafirun": 30,
  "An-Nasr": 30,
  "Al-Masad": 30,
  "Al-Ikhlas": 30,
  "Al-Falaq": 30,
  "An-Nas": 30,
};

// Calculate which juz a surah and ayah is in
export const getSurahJuz = (surah: string, ayah?: number) => {
  const juzInfo = surahJuzMapping[surah];
  
  if (!juzInfo) return null;
  
  // If surah is only in one juz
  if (typeof juzInfo === 'number') {
    return juzInfo;
  }
  
  // If surah spans multiple juz but no ayah info is provided
  if (!ayah) {
    return juzInfo[0]; // Return the first juz it appears in
  }
  
  // TODO: For a more accurate calculation, we would need ayah ranges for each juz
  // This is a simplified version
  return juzInfo[0];
};

// Calculate progress percentage based on completed juz
export const calculateJuzProgress = (completedJuz: number[] | null) => {
  if (!completedJuz || !completedJuz.length) return 0;
  return Math.round((completedJuz.length / 30) * 100);
};

export const getMistakeTypeColor = (type: string) => {
  const mistakeType = mistakeTypeInfo.find(m => m.value === type);
  return mistakeType?.color || "#d1d5db";
};

export const getMistakeTypeLabel = (type: string) => {
  const mistakeType = mistakeTypeInfo.find(m => m.value === type);
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
