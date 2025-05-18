# Troubleshooting Guide for Quran Memorization Tracking App

## Core Issues and Solutions

### 1. "Lesson Not Found" Error When Clicking Track Button

**Issue:** Users received a "Lesson Not Found" error when clicking the Track button on lessons.

**Root Cause:** 
- The API call for creating lesson mistakes was missing the required `surah` field.
- The API endpoint expected a `surah` parameter but the client was not sending it.

**Solution:**
- Updated the mistake creation mutation to include the surah parameter from the current lesson:
  ```javascript
  // Added surah field to the API request
  return await apiRequest("POST", "/api/lesson-mistakes", {
    lessonId,
    studentId: lesson?.studentId,
    type: data.type as MistakeType,
    ayah: data.ayah,
    description: data.details || null,
    surah: lesson?.surahStart || "",
  });
  ```
- Modified the server route to handle missing surah values by fetching from the associated lesson:
  ```javascript
  // Get the surah from the lesson if not provided
  let mistakeSurah = surah;
  if (!mistakeSurah) {
    const lesson = await storage.getLesson(lessonId);
    if (lesson) {
      mistakeSurah = lesson.surahStart;
    } else {
      mistakeSurah = ""; // Default empty string if lesson not found
    }
  }
  ```

### 2. "New Lesson" Button Not Working from Student Cards

**Issue:** The "New Lesson" button on student cards in the teacher dashboard was not working correctly.

**Root Cause:**
- The CreateLessonDialog component was not being properly integrated with the student cards.
- The student selection was not being initialized with the student from the card.

**Solution:**
- Added initialStudent prop to CreateLessonDialog component:
  ```javascript
  <CreateLessonDialog
    students={assignedStudents || []}
    teacherId={currentUser?.id || 0}
    initialStudent={student}
    trigger={
      <Button className="flex-1 bg-blue-500 hover:bg-blue-600">
        New Lesson
      </Button>
    }
  />
  ```
- Used useEffect to reset form when dialog opens with initialStudent:
  ```javascript
  useEffect(() => {
    if (open && initialStudent) {
      form.setValue("studentId", initialStudent.id.toString());
    }
  }, [open, initialStudent, form]);
  ```

### 3. Zero Assigned Students in Teacher Dashboard

**Issue:** The teacher dashboard displayed "0 assigned students" even when students were assigned.

**Root Cause:**
- The getTeacherLessonStats method was only counting students from lessons, not from direct teacher-student assignments.

**Solution:**
- Updated the getTeacherLessonStats method to include students directly assigned to the teacher:
  ```javascript
  // Add students directly assigned to this teacher
  const teacherStudentRelations = Array.from(this.teacherStudentsData.values())
    .filter(rel => rel.teacherId === teacherId);
  
  teacherStudentRelations.forEach(relation => {
    uniqueStudentIds.add(relation.studentId);
  });
  ```

### 4. Type Mismatch in MistakeSchema

**Issue:** There was a type mismatch between the form schema and the API types for mistake tracking.

**Root Cause:**
- The mistake schema was using hardcoded string literals instead of the shared enum types.

**Solution:**
- Updated the mistake schema to use the shared mistakeTypes enum:
  ```javascript
  const mistakeSchema = z.object({
    type: z.enum(mistakeTypes),
    ayah: z.number().min(1, "Ayah number must be at least 1"),
    details: z.string().optional(),
  });
  ```

### 5. Field Name Mismatch in Mistake Creation

**Issue:** The client was sending `details` but the server expected `description`.

**Root Cause:**
- Inconsistent naming between client and server models for mistake descriptions.

**Solution:**
- Updated the server route to handle both field names:
  ```javascript
  description: description || details || null
  ```

## Pending Issues

### 1. Progress Field Removal

**Issue:** The progress field should be removed from lesson creation form, as it should always start as "In Progress" and only be completed via the Complete Lesson button.

### 2. Persistent Lesson Not Found Errors

**Issue:** Some users still experience "Lesson Not Found" errors when clicking Track, possibly due to:
- Race conditions where the lesson ID is not properly loaded
- Incorrect API endpoint format or routing issues
- Permissions problems where the teacher doesn't have access to view/modify the lesson