/**
 * Auto-generated-like types from observed Supabase schema.
 * Replace the `as unknown as` pattern throughout the codebase.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          name: string | null;
          email: string | null;
          role: "admin" | "student" | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id: string;
          name?: string | null;
          email?: string | null;
          role?: "admin" | "student" | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string | null;
          email?: string | null;
          role?: "admin" | "student" | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      courses: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          created_at?: string | null;
        };
      };
      modules: {
        Row: {
          id: string;
          course_id: string;
          title: string;
          order_index: number;
          description: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          course_id: string;
          title: string;
          order_index: number;
          description?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          course_id?: string;
          title?: string;
          order_index?: number;
          description?: string | null;
          created_at?: string | null;
        };
      };
      module_progress: {
        Row: {
          id: string;
          user_id: string;
          module_id: string;
          completed: boolean | null;
          quiz_score: number | null;
          assignment_submitted: boolean | null;
          mentorship_unlocked: boolean | null;
          started_at: string | null;
          completed_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          module_id: string;
          completed?: boolean | null;
          quiz_score?: number | null;
          assignment_submitted?: boolean | null;
          mentorship_unlocked?: boolean | null;
          started_at?: string | null;
          completed_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          module_id?: string;
          completed?: boolean | null;
          quiz_score?: number | null;
          assignment_submitted?: boolean | null;
          mentorship_unlocked?: boolean | null;
          started_at?: string | null;
          completed_at?: string | null;
          updated_at?: string | null;
        };
      };
      module_assignments: {
        Row: {
          id: string;
          module_id: string;
          assignment_prompt: string | null;
          speech_prompt: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          module_id: string;
          assignment_prompt?: string | null;
          speech_prompt?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          module_id?: string;
          assignment_prompt?: string | null;
          speech_prompt?: string | null;
          created_at?: string | null;
        };
      };
      assignment_submissions: {
        Row: {
          id: string;
          user_id: string;
          module_id: string;
          kind: string;
          content: string | null;
          file_url: string | null;
          status: string | null;
          reviewer_notes: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          module_id: string;
          kind: string;
          content?: string | null;
          file_url?: string | null;
          status?: string | null;
          reviewer_notes?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          module_id?: string;
          kind?: string;
          content?: string | null;
          file_url?: string | null;
          status?: string | null;
          reviewer_notes?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      lessons: {
        Row: {
          id: string;
          module_id: string;
          title: string;
          content: string | null;
          order_index: number;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          module_id: string;
          title: string;
          content?: string | null;
          order_index?: number;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          module_id?: string;
          title?: string;
          content?: string | null;
          order_index?: number;
          created_at?: string | null;
        };
      };
      lesson_completions: {
        Row: {
          id: string;
          user_id: string;
          lesson_id: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          lesson_id: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          lesson_id?: string;
          completed_at?: string | null;
        };
      };
      flashcard_sets: {
        Row: {
          id: string;
          module_id: string;
          title: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          module_id: string;
          title?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          module_id?: string;
          title?: string | null;
          created_at?: string | null;
        };
      };
      flashcards: {
        Row: {
          id: string;
          set_id: string;
          front: string;
          back: string;
          order_index: number;
        };
        Insert: {
          id?: string;
          set_id: string;
          front: string;
          back: string;
          order_index?: number;
        };
        Update: {
          id?: string;
          set_id?: string;
          front?: string;
          back?: string;
          order_index?: number;
        };
      };
      flashcard_reviews: {
        Row: {
          id: string;
          user_id: string;
          card_id: string;
          quality: number;
          reviewed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          card_id: string;
          quality: number;
          reviewed_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          card_id?: string;
          quality?: number;
          reviewed_at?: string | null;
        };
      };
      quiz_questions: {
        Row: {
          id: string;
          module_id: string;
          question: string;
          options: Json | null;
          correct_option: number;
        };
        Insert: {
          id?: string;
          module_id: string;
          question: string;
          options?: Json | null;
          correct_option: number;
        };
        Update: {
          id?: string;
          module_id?: string;
          question?: string;
          options?: Json | null;
          correct_option?: number;
        };
      };
      lesson_quiz_questions: {
        Row: {
          id: string;
          lesson_id: string;
          question: string;
          options: Json | null;
          correct_option: number;
        };
        Insert: {
          id?: string;
          lesson_id: string;
          question: string;
          options?: Json | null;
          correct_option: number;
        };
        Update: {
          id?: string;
          lesson_id?: string;
          question?: string;
          options?: Json | null;
          correct_option?: number;
        };
      };
      quiz_attempts: {
        Row: {
          id: string;
          user_id: string;
          module_id: string;
          passed: boolean | null;
          score: number | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          module_id: string;
          passed?: boolean | null;
          score?: number | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          module_id?: string;
          passed?: boolean | null;
          score?: number | null;
          created_at?: string | null;
        };
      };
      texts: {
        Row: {
          id: string;
          module_id: string;
          slug: string;
          title: string;
          content: string | null;
          order_index: number;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          module_id: string;
          slug: string;
          title: string;
          content?: string | null;
          order_index?: number;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          module_id?: string;
          slug?: string;
          title?: string;
          content?: string | null;
          order_index?: number;
          created_at?: string | null;
        };
      };
      mentoring_applications: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          context: string | null;
          conflict_type: string | null;
          failure_points: string | null;
          result: string | null;
          status: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          email: string;
          name?: string | null;
          context?: string | null;
          conflict_type?: string | null;
          failure_points?: string | null;
          result?: string | null;
          status?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string | null;
          context?: string | null;
          conflict_type?: string | null;
          failure_points?: string | null;
          result?: string | null;
          status?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      purchases: {
        Row: {
          id: string;
          user_id: string;
          stripe_session_id: string;
          amount_total: number | null;
          currency: string | null;
          kind: string;
          course_id: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          stripe_session_id: string;
          amount_total?: number | null;
          currency?: string | null;
          kind: string;
          course_id?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          stripe_session_id?: string;
          amount_total?: number | null;
          currency?: string | null;
          kind?: string;
          course_id?: string | null;
          created_at?: string | null;
        };
      };
      system_logs: {
        Row: {
          id: string;
          ts: string | null;
          actor: string;
          action: string;
          target: string | null;
          data: Json | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          ts?: string | null;
          actor: string;
          action: string;
          target?: string | null;
          data?: Json | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          ts?: string | null;
          actor?: string;
          action?: string;
          target?: string | null;
          data?: Json | null;
          created_at?: string | null;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          title: string;
          body: string;
          link: string | null;
          read: boolean;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          title: string;
          body: string;
          link?: string | null;
          read?: boolean;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: string;
          title?: string;
          body?: string;
          link?: string | null;
          read?: boolean;
          created_at?: string | null;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};

// Convenience type aliases
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type Insertable<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];

export type Updatable<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

// Common aliases
export type User = Tables<"users">;
export type Module = Tables<"modules">;
export type ModuleProgress = Tables<"module_progress">;
export type Lesson = Tables<"lessons">;
export type LessonCompletion = Tables<"lesson_completions">;
export type AssignmentSubmission = Tables<"assignment_submissions">;
export type ModuleAssignment = Tables<"module_assignments">;
export type QuizAttempt = Tables<"quiz_attempts">;
export type Flashcard = Tables<"flashcards">;
export type FlashcardSet = Tables<"flashcard_sets">;
export type Purchase = Tables<"purchases">;
export type Text = Tables<"texts">;
export type MentoringApplication = Tables<"mentoring_applications">;
