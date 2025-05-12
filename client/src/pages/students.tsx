import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { StudentWithStats } from "@shared/schema";
import { StudentCard } from "@/components/ui/student-card";
import { AddStudentDialog } from "@/components/ui/add-student-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";
import { UserPlus, Search } from "lucide-react";

export default function Students() {
  const [searchTerm, setSearchTerm] = useState("");
  const [gradeFilter, setGradeFilter] = useState("");
  const [showAddStudentDialog, setShowAddStudentDialog] = useState(false);

  const { data: students, isLoading } = useQuery<StudentWithStats[]>({
    queryKey: ["/api/students/stats"]
  });

  const filteredStudents = students?.filter(student => {
    return (
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (gradeFilter === "" || student.grade === gradeFilter)
    );
  });

  return (
    <div className="p-4 md:p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-heading font-semibold">Students</h2>
        <Button 
          onClick={() => setShowAddStudentDialog(true)}
          className="bg-primary-500 hover:bg-primary-600 text-white transition-colors"
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Add Student
        </Button>
      </div>
      
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow">
          <Input
            type="text"
            placeholder="Search students..."
            className="w-full pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 h-4 w-4" />
        </div>
        <div className="w-full md:w-48">
          <Select value={gradeFilter} onValueChange={setGradeFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All Grades" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Grades</SelectItem>
              <SelectItem value="1">Grade 1</SelectItem>
              <SelectItem value="2">Grade 2</SelectItem>
              <SelectItem value="3">Grade 3</SelectItem>
              <SelectItem value="4">Grade 4</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {isLoading ? (
        <div className="text-center py-8">Loading students...</div>
      ) : filteredStudents && filteredStudents.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStudents.map(student => (
            <StudentCard key={student.id} student={student} />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 bg-white rounded-lg shadow-sm border border-neutral-100">
          {searchTerm || gradeFilter ? "No students match your filters" : "No students found. Add your first student!"}
        </div>
      )}
      
      {students && students.length > 6 && (
        <div className="mt-6 flex justify-center">
          <Button variant="outline" className="bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-600 transition-colors">
            Load More
          </Button>
        </div>
      )}
      
      <AddStudentDialog 
        isOpen={showAddStudentDialog} 
        onClose={() => setShowAddStudentDialog(false)} 
      />
    </div>
  );
}
