import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  Card, 
  CardContent, 
  CardHeader,
  CardTitle,
  CardDescription, 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { ArrowUpRight, ArrowDownRight, ArrowRight, CalendarIcon, BookOpen, Award, TrendingUp } from "lucide-react";
import { formatDate } from "@/lib/constants";
import { Student, StudentWithStats } from "@shared/schema";

// Component for displaying improvement data for a specific student
export default function ProgressPage() {
  // State to track selected student and time period
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [timePeriod, setTimePeriod] = useState<string>("30");

  // Fetch all students
  const { data: students = [], isLoading: isLoadingStudents } = useQuery<Student[]>({
    queryKey: ["/api/students"]
  });

  // Fetch student stats
  const { data: studentsWithStats = [], isLoading: isLoadingStats } = useQuery<StudentWithStats[]>({
    queryKey: ["/api/students/stats"]
  });

  // Fetch mistake trend data
  const { data: mistakeTrend = [], isLoading: isLoadingTrend } = useQuery({
    queryKey: ["/api/stats/mistake-trend", { days: parseInt(timePeriod) }]
  });

  // Student-specific progress (will be fetched when a student is selected)
  const { data: studentProgress = [], isLoading: isLoadingStudentProgress } = useQuery({
    queryKey: ["/api/students/progress", { 
      studentId: selectedStudentId ? parseInt(selectedStudentId) : 0,
      days: parseInt(timePeriod)
    }],
    enabled: !!selectedStudentId
  });

  // Get the selected student
  const selectedStudent = selectedStudentId 
    ? studentsWithStats.find(s => s.id === parseInt(selectedStudentId)) 
    : null;

  // Function to create mock progress data (will be replaced with actual API data)
  const getProgressData = () => {
    // This will be replaced with actual API data in the real implementation
    // This is just a placeholder to show the UI
    return [
      {
        month: "Jan",
        mistakeRate: 4.2,
        avgSessionTime: 20
      },
      {
        month: "Feb",
        mistakeRate: 3.8,
        avgSessionTime: 18
      },
      {
        month: "Mar",
        mistakeRate: 3.2,
        avgSessionTime: 15
      },
      {
        month: "Apr",
        mistakeRate: 2.5,
        avgSessionTime: 15
      },
      {
        month: "May",
        mistakeRate: 2.0,
        avgSessionTime: 12
      },
    ];
  };

  // Function to create mock focus area data
  const getFocusAreaData = () => {
    return [
      {
        area: "Tajweed Rules",
        count: 12
      },
      {
        area: "Word Recognition",
        count: 8
      },
      {
        area: "Memorization",
        count: 5
      },
      {
        area: "Fluency",
        count: 3
      }
    ];
  };

  // Get progress metrics
  const getPerformanceMetrics = () => {
    if (!selectedStudent) return { 
      improvementRate: 0,
      consistencyScore: 0,
      mistakeReduction: 0,
      completionRate: 0
    };

    // In real implementation, these would be calculated from actual data
    return {
      improvementRate: 18, // percentage improvement
      consistencyScore: 85, // percentage
      mistakeReduction: 32, // percentage reduction
      completionRate: 92 // percentage
    };
  };

  const metrics = getPerformanceMetrics();
  const progressData = getProgressData();
  const focusAreaData = getFocusAreaData();

  return (
    <div className="container py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Progress & Improvement</h1>
        <div className="flex gap-4">
          <Select value={timePeriod} onValueChange={setTimePeriod}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Time Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 3 months</SelectItem>
              <SelectItem value="180">Last 6 months</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select Student" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Students</SelectItem>
              {students.map(student => (
                <SelectItem key={student.id} value={student.id.toString()}>
                  {student.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Progress Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start mb-2">
              <div className="w-12 h-12 bg-primary-100 text-primary-800 rounded-full flex items-center justify-center">
                <TrendingUp size={20} />
              </div>
              <div className="bg-primary-50 text-primary-600 text-xs px-2 py-1 rounded-full">
                +{metrics.improvementRate}%
              </div>
            </div>
            <h3 className="text-2xl font-bold mt-2">
              {selectedStudent ? selectedStudent.averageMistakes.toFixed(1) : "2.3"}
            </h3>
            <p className="text-sm text-neutral-500">Average Mistakes per Session</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start mb-2">
              <div className="w-12 h-12 bg-secondary-100 text-secondary-800 rounded-full flex items-center justify-center">
                <CalendarIcon size={20} />
              </div>
              <div className="bg-secondary-50 text-secondary-600 text-xs px-2 py-1 rounded-full">
                {metrics.consistencyScore}%
              </div>
            </div>
            <h3 className="text-2xl font-bold mt-2">
              {selectedStudent ? selectedStudent.sessionCount : "18"}
            </h3>
            <p className="text-sm text-neutral-500">Total Sessions Completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start mb-2">
              <div className="w-12 h-12 bg-accent-100 text-accent-800 rounded-full flex items-center justify-center">
                <BookOpen size={20} />
              </div>
              <div className="bg-accent-50 text-accent-600 text-xs px-2 py-1 rounded-full">
                {metrics.mistakeReduction}% less
              </div>
            </div>
            <h3 className="text-2xl font-bold mt-2">
              {selectedStudent ? selectedStudent.mostCommonMistakeType || "Tajweed" : "Tajweed"}
            </h3>
            <p className="text-sm text-neutral-500">Most Common Mistake Type</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start mb-2">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center">
                <Award size={20} />
              </div>
              <div className="bg-emerald-50 text-emerald-600 text-xs px-2 py-1 rounded-full">
                {metrics.completionRate}%
              </div>
            </div>
            <h3 className="text-2xl font-bold mt-2">
              {selectedStudent ? selectedStudent.name : "Ahmad H."}
            </h3>
            <p className="text-sm text-neutral-500">Most Improved Student</p>
          </CardContent>
        </Card>
      </div>

      {/* Progress Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Mistake Rate Over Time</CardTitle>
            <CardDescription>
              Average number of mistakes per session over the selected time period
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={progressData} margin={{ top: 5, right: 20, bottom: 20, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="mistakeRate" 
                    name="Mistakes per Session"
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2} 
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Focus Areas</CardTitle>
            <CardDescription>
              Areas that need the most attention based on recent mistakes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={focusAreaData} layout="vertical" margin={{ top: 5, right: 20, bottom: 20, left: 100 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="area" />
                  <Tooltip />
                  <Bar 
                    dataKey="count" 
                    name="Mistakes" 
                    fill="hsl(var(--primary))" 
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Improvement Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Improvement Recommendations</CardTitle>
          <CardDescription>
            {selectedStudent 
              ? `Personalized recommendations for ${selectedStudent.name}` 
              : "General recommendations for all students"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-primary-50 rounded-lg border border-primary-100">
              <h3 className="font-medium text-primary-800 mb-2">Focus on Tajweed Rules</h3>
              <p className="text-sm text-neutral-600 mb-3">
                {selectedStudent ? selectedStudent.name : "Students"} should spend more time practicing specific tajweed rules, particularly in the areas of proper pronunciation of heavy letters.
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm text-primary-600">
                  <span className="bg-primary-100 text-primary-800 w-6 h-6 rounded-full flex items-center justify-center mr-2">1</span>
                  Highest priority
                </div>
                <Button variant="outline" size="sm" className="text-primary-600 border-primary-200">
                  View Exercises <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="p-4 bg-secondary-50 rounded-lg border border-secondary-100">
              <h3 className="font-medium text-secondary-800 mb-2">Regular Revision Sessions</h3>
              <p className="text-sm text-neutral-600 mb-3">
                Increase frequency of revision to at least 4 times per week to improve retention and fluency.
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm text-secondary-600">
                  <span className="bg-secondary-100 text-secondary-800 w-6 h-6 rounded-full flex items-center justify-center mr-2">2</span>
                  Medium priority
                </div>
                <Button variant="outline" size="sm" className="text-secondary-600 border-secondary-200">
                  Schedule Sessions <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="p-4 bg-accent-50 rounded-lg border border-accent-100">
              <h3 className="font-medium text-accent-800 mb-2">Word Recognition Practice</h3>
              <p className="text-sm text-neutral-600 mb-3">
                Practice similar-looking words that are frequently confused to improve accuracy and reduce mistakes.
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm text-accent-600">
                  <span className="bg-accent-100 text-accent-800 w-6 h-6 rounded-full flex items-center justify-center mr-2">3</span>
                  Ongoing focus
                </div>
                <Button variant="outline" size="sm" className="text-accent-600 border-accent-200">
                  Word Exercises <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}