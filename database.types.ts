// Supabase Database Types
// Auto-generated stub for type safety (run `supabase gen types typescript` to update).

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          role?: string | null;
          email?: string | null;
        };
        Insert: {
          id?: string;
          role?: string | null;
          email?: string | null;
        };
        Update: {
          id?: string;
          role?: string | null;
          email?: string | null;
        };
      };
    };
  };
}