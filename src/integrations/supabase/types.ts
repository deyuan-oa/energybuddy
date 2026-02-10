export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      audit_checklist_items: {
        Row: {
          checked: boolean
          clause: string
          created_at: string
          description: string
          evidence: string
          id: string
          priority: string
          requirement: string
          updated_at: string
        }
        Insert: {
          checked?: boolean
          clause: string
          created_at?: string
          description: string
          evidence?: string
          id: string
          priority?: string
          requirement: string
          updated_at?: string
        }
        Update: {
          checked?: boolean
          clause?: string
          created_at?: string
          description?: string
          evidence?: string
          id?: string
          priority?: string
          requirement?: string
          updated_at?: string
        }
        Relationships: []
      }
      corrective_actions: {
        Row: {
          action_code: string
          ai_suggested: boolean
          closed_at: string | null
          created_at: string
          created_by_id: string | null
          description: string | null
          due_date: string | null
          id: string
          linked_kpi: string | null
          linked_seu: string | null
          outcome_notes: string | null
          owner_id: string | null
          priority: Database["public"]["Enums"]["action_priority"]
          required_evidence: string | null
          root_cause: string | null
          status: Database["public"]["Enums"]["action_status"]
          title: string
          updated_at: string
        }
        Insert: {
          action_code: string
          ai_suggested?: boolean
          closed_at?: string | null
          created_at?: string
          created_by_id?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          linked_kpi?: string | null
          linked_seu?: string | null
          outcome_notes?: string | null
          owner_id?: string | null
          priority?: Database["public"]["Enums"]["action_priority"]
          required_evidence?: string | null
          root_cause?: string | null
          status?: Database["public"]["Enums"]["action_status"]
          title: string
          updated_at?: string
        }
        Update: {
          action_code?: string
          ai_suggested?: boolean
          closed_at?: string | null
          created_at?: string
          created_by_id?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          linked_kpi?: string | null
          linked_seu?: string | null
          outcome_notes?: string | null
          owner_id?: string | null
          priority?: Database["public"]["Enums"]["action_priority"]
          required_evidence?: string | null
          root_cause?: string | null
          status?: Database["public"]["Enums"]["action_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "corrective_actions_created_by_id_fkey"
            columns: ["created_by_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "corrective_actions_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_logs: {
        Row: {
          ai_draft: string | null
          author_id: string | null
          created_at: string
          finalized: boolean
          guide_steps_completed: number
          id: string
          log_date: string
          notes: string | null
          summary: string | null
          total_guide_steps: number
          updated_at: string
          xp_earned: number
        }
        Insert: {
          ai_draft?: string | null
          author_id?: string | null
          created_at?: string
          finalized?: boolean
          guide_steps_completed?: number
          id?: string
          log_date?: string
          notes?: string | null
          summary?: string | null
          total_guide_steps?: number
          updated_at?: string
          xp_earned?: number
        }
        Update: {
          ai_draft?: string | null
          author_id?: string | null
          created_at?: string
          finalized?: boolean
          guide_steps_completed?: number
          id?: string
          log_date?: string
          notes?: string | null
          summary?: string | null
          total_guide_steps?: number
          updated_at?: string
          xp_earned?: number
        }
        Relationships: [
          {
            foreignKeyName: "daily_logs_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
        ]
      }
      pdca_items: {
        Row: {
          created_at: string
          description: string
          due_date: string
          evidence: string[]
          id: string
          notes: string
          owner: string
          phase: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string
          due_date?: string
          evidence?: string[]
          id: string
          notes?: string
          owner?: string
          phase: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          due_date?: string
          evidence?: string[]
          id?: string
          notes?: string
          owner?: string
          phase?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      report_evidence: {
        Row: {
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id: string
          report_id: string
          uploaded_at: string
        }
        Insert: {
          file_name: string
          file_path: string
          file_size?: number
          file_type: string
          id?: string
          report_id: string
          uploaded_at?: string
        }
        Update: {
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
          report_id?: string
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_evidence_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          ai_draft: string | null
          author_id: string | null
          created_at: string
          final_content: string | null
          id: string
          metadata: Json | null
          report_date: string
          report_type: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          ai_draft?: string | null
          author_id?: string | null
          created_at?: string
          final_content?: string | null
          id?: string
          metadata?: Json | null
          report_date: string
          report_type: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          ai_draft?: string | null
          author_id?: string | null
          created_at?: string
          final_content?: string | null
          id?: string
          metadata?: Json | null
          report_date?: string
          report_type?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          active: boolean
          created_at: string
          email: string | null
          id: string
          name: string
          role: Database["public"]["Enums"]["team_role"]
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          email?: string | null
          id?: string
          name: string
          role?: Database["public"]["Enums"]["team_role"]
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          role?: Database["public"]["Enums"]["team_role"]
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      action_priority: "low" | "medium" | "high" | "critical"
      action_status: "open" | "in_progress" | "closed" | "verified"
      team_role: "operator" | "supervisor" | "manager"
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

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      action_priority: ["low", "medium", "high", "critical"],
      action_status: ["open", "in_progress", "closed", "verified"],
      team_role: ["operator", "supervisor", "manager"],
    },
  },
} as const
