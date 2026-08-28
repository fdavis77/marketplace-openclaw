export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      auditions: {
        Row: {
          audition_date: string | null
          callback_date: string | null
          casting_office: string | null
          created_at: string
          headshot_id: string | null
          id: string
          notes: string | null
          owner_id: string
          project_name: string
          reel_id: string | null
          resume_id: string | null
          role_name: string
          self_tape_deadline: string | null
          self_tape_url: string | null
          sides_url: string | null
          status: string
          take_notes: string | null
        }
        Insert: {
          audition_date?: string | null
          callback_date?: string | null
          casting_office?: string | null
          created_at?: string
          headshot_id?: string | null
          id?: string
          notes?: string | null
          owner_id: string
          project_name: string
          reel_id?: string | null
          resume_id?: string | null
          role_name: string
          self_tape_deadline?: string | null
          self_tape_url?: string | null
          sides_url?: string | null
          status?: string
          take_notes?: string | null
        }
        Update: {
          audition_date?: string | null
          callback_date?: string | null
          casting_office?: string | null
          created_at?: string
          headshot_id?: string | null
          id?: string
          notes?: string | null
          owner_id?: string
          project_name?: string
          reel_id?: string | null
          resume_id?: string | null
          role_name?: string
          self_tape_deadline?: string | null
          self_tape_url?: string | null
          sides_url?: string | null
          status?: string
          take_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "auditions_headshot_id_fkey"
            columns: ["headshot_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auditions_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auditions_reel_id_fkey"
            columns: ["reel_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auditions_resume_id_fkey"
            columns: ["resume_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
        ]
      }
      availability_blocks: {
        Row: {
          created_at: string
          end_date: string
          id: string
          owner_id: string
          reason: string | null
          start_date: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          owner_id: string
          reason?: string | null
          start_date: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          owner_id?: string
          reason?: string | null
          start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "availability_blocks_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      materials: {
        Row: {
          created_at: string
          id: string
          label: string
          owner_id: string
          type: string
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          label: string
          owner_id: string
          type?: string
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          owner_id?: string
          type?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "materials_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          bio: string | null
          created_at: string
          creative_roles: string[]
          display_name: string
          id: string
          links: Json
          location: string | null
          photo_url: string | null
        }
        Insert: {
          bio?: string | null
          created_at?: string
          creative_roles?: string[]
          display_name?: string
          id: string
          links?: Json
          location?: string | null
          photo_url?: string | null
        }
        Update: {
          bio?: string | null
          created_at?: string
          creative_roles?: string[]
          display_name?: string
          id?: string
          links?: Json
          location?: string | null
          photo_url?: string | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          created_at: string
          format: string
          id: string
          logline: string | null
          owner_id: string
          stage: string
          target_deadline: string | null
          title: string
        }
        Insert: {
          created_at?: string
          format?: string
          id?: string
          logline?: string | null
          owner_id: string
          stage?: string
          target_deadline?: string | null
          title: string
        }
        Update: {
          created_at?: string
          format?: string
          id?: string
          logline?: string | null
          owner_id?: string
          stage?: string
          target_deadline?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      scenes: {
        Row: {
          created_at: string
          heading: string
          id: string
          notes: string | null
          project_id: string
          scene_number: number
          status: string
        }
        Insert: {
          created_at?: string
          heading?: string
          id?: string
          notes?: string | null
          project_id: string
          scene_number?: number
          status?: string
        }
        Update: {
          created_at?: string
          heading?: string
          id?: string
          notes?: string | null
          project_id?: string
          scene_number?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "scenes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      submissions: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          project_id: string
          response_due_at: string | null
          status: string
          submitted_at: string
          target_name: string
          target_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          project_id: string
          response_due_at?: string | null
          status?: string
          submitted_at?: string
          target_name: string
          target_type?: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          project_id?: string
          response_due_at?: string | null
          status?: string
          submitted_at?: string
          target_name?: string
          target_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "submissions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      writing_goals: {
        Row: {
          cadence: string
          id: string
          owner_id: string
          target_amount: number
          unit: string
        }
        Insert: {
          cadence?: string
          id?: string
          owner_id: string
          target_amount?: number
          unit?: string
        }
        Update: {
          cadence?: string
          id?: string
          owner_id?: string
          target_amount?: number
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "writing_goals_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      writing_sessions: {
        Row: {
          amount: number
          created_at: string
          id: string
          notes: string | null
          owner_id: string
          project_id: string | null
          session_date: string
          unit: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          notes?: string | null
          owner_id: string
          project_id?: string | null
          session_date?: string
          unit?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          notes?: string | null
          owner_id?: string
          project_id?: string | null
          session_date?: string
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "writing_sessions_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "writing_sessions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
