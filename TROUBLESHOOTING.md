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

## Resolved Issues (Continued)

### 6. Progress Field in Lesson Creation Form

**Issue:** The progress field in the lesson creation form was causing confusion since lesson progress should only be managed via the Complete Lesson button.

**Root Cause:**
- The progress field was unnecessarily exposed in the UI when it should be managed programmatically.

**Solution:**
- Removed the progress form field from the lesson creation dialog
- Default progress is set to "In Progress" automatically
- Progress can only be updated to "Completed" via the Complete Lesson button

### 7. Persistent Lesson Not Found Errors

**Issue:** Users experienced "Lesson Not Found" errors when clicking Track on a lesson.

**Root Cause:**
- The API was returning 404 errors when lessons were not found, causing the UI to break
- There was no retry mechanism to handle temporary loading issues
- Lesson queries did not have sufficient retry logic

**Solution:**
- Updated the lesson mistakes API to handle not-found lessons gracefully (return empty array instead of 404)
- Added retry logic to the lesson and mistake queries (3 retries with delay)
- Added a new Retry button on the Lesson Not Found page to help recover from temporary issues
- Improved loading state handling to show clear feedback during data loading

## Current Issues

### 1. Application Not Starting

**Issue:** The application sometimes fails to start properly.

**Potential Causes:**
- Typescript errors preventing compilation
- Database connection issues
- Conflicting dependencies
- Port conflicts

**Workaround:**
- Restart the workflow to reinitialize the application
- Check console logs for specific error messages
- Ensure database connection is properly established