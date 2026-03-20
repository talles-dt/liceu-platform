export type CourseId = string;
export type ModuleId = string;

export type Module = {
  id: ModuleId;
  courseId: CourseId;
  index: number; // strict ordering within course
  title: string;
  description?: string;
};

export type Course = {
  id: CourseId;
  title: string;
  description?: string;
  modules: Module[];
};

export type LessonId = string;

export type Lesson = {
  id: LessonId;
  moduleId: ModuleId;
  index: number;
  title: string;
};

export type LessonCompletion = {
  lessonId: LessonId;
  completed: boolean;
};

export type ModuleProgress = {
  moduleId: ModuleId;
  completed: boolean;
  quizScore: number | null;
  assignmentApproved: boolean;
  mentorshipUnlocked: boolean;
};

export function isModuleCompleted(options: {
  moduleId: ModuleId;
  lessons: Lesson[];
  lessonCompletions: LessonCompletion[];
  quizScore: number | null;
  assignmentApproved: boolean;
}): boolean {
  const { moduleId, lessons, lessonCompletions, quizScore, assignmentApproved } =
    options;

  if (!assignmentApproved) return false;
  if (quizScore === null || quizScore < 70) return false;

  const moduleLessons = lessons.filter((l) => l.moduleId === moduleId);
  if (moduleLessons.length === 0) {
    // A module with no lessons cannot be considered completed.
    return false;
  }

  const completedLessonIds = new Set(
    lessonCompletions.filter((lc) => lc.completed).map((lc) => lc.lessonId),
  );

  const allLessonsCompleted = moduleLessons.every((lesson) =>
    completedLessonIds.has(lesson.id),
  );

  if (!allLessonsCompleted) return false;

  return true;
}

export function canAccessModule(
  target: Module,
  modules: Module[],
  progress: ModuleProgress[],
): boolean {
  const ordered = [...modules]
    .filter((m) => m.courseId === target.courseId)
    .sort((a, b) => a.index - b.index);

  const targetIndex = ordered.findIndex((m) => m.id === target.id);
  if (targetIndex === -1) return false;

  // First module is always accessible
  if (targetIndex === 0) return true;

  // All previous modules must be completed with >=70% and assignment
  const previous = ordered.slice(0, targetIndex);
  return previous.every((m) => {
    const p = progress.find((mp) => mp.moduleId === m.id);
    if (!p) return false;
    if (!p.completed) return false;
    if (p.quizScore === null || p.quizScore < 70) return false;
    if (!p.assignmentApproved) return false;
    return true;
  });
}

export function canUnlockMentorship(p: ModuleProgress): boolean {
  return (
    p.completed &&
    !p.mentorshipUnlocked &&
    p.quizScore !== null &&
    p.quizScore >= 70 &&
    p.assignmentApproved
  );
}

