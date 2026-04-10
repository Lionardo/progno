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
      forecast_revisions: {
        Row: {
          created_at: string;
          fail_value: number;
          forecast_id: string;
          id: string;
          initiative_id: string;
          pass_value: number;
          points_used: number;
        };
        Insert: {
          created_at?: string;
          fail_value: number;
          forecast_id: string;
          id?: string;
          initiative_id: string;
          pass_value: number;
          points_used?: number;
        };
        Update: {
          created_at?: string;
          fail_value?: number;
          forecast_id?: string;
          id?: string;
          initiative_id?: string;
          pass_value?: number;
          points_used?: number;
        };
        Relationships: [];
      };
      forecasts: {
        Row: {
          created_at: string;
          fail_value: number;
          id: string;
          initiative_id: string;
          pass_value: number;
          points_used: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          fail_value: number;
          id?: string;
          initiative_id: string;
          pass_value: number;
          points_used?: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          fail_value?: number;
          id?: string;
          initiative_id?: string;
          pass_value?: number;
          points_used?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      initiative_import_runs: {
        Row: {
          applied_initiative_ids: string[] | null;
          created_at: string;
          error_message: string | null;
          id: string;
          preview_payload: Json;
          raw_payload: string;
          source_hash: string;
          source_key: string;
          source_url: string;
          status: "applied" | "failed" | "previewed";
          triggered_by: string | null;
        };
        Insert: {
          applied_initiative_ids?: string[] | null;
          created_at?: string;
          error_message?: string | null;
          id?: string;
          preview_payload: Json;
          raw_payload: string;
          source_hash: string;
          source_key: string;
          source_url: string;
          status?: "applied" | "failed" | "previewed";
          triggered_by?: string | null;
        };
        Update: {
          applied_initiative_ids?: string[] | null;
          created_at?: string;
          error_message?: string | null;
          id?: string;
          preview_payload?: Json;
          raw_payload?: string;
          source_hash?: string;
          source_key?: string;
          source_url?: string;
          status?: "applied" | "failed" | "previewed";
          triggered_by?: string | null;
        };
        Relationships: [];
      };
      initiative_news_snapshots: {
        Row: {
          article_count: number;
          confidence_score: number | null;
          created_at: string;
          error_message: string | null;
          id: string;
          initiative_id: string;
          model: string;
          prompt_version: string;
          scheduled_for: string;
          sentiment_label:
            | "insufficient_signal"
            | "mixed"
            | "negative"
            | "positive"
            | null;
          sentiment_score: number | null;
          sources: Json;
          status: "failed" | "insufficient_signal" | "succeeded";
          summary_en: string | null;
        };
        Insert: {
          article_count?: number;
          confidence_score?: number | null;
          created_at?: string;
          error_message?: string | null;
          id?: string;
          initiative_id: string;
          model: string;
          prompt_version: string;
          scheduled_for: string;
          sentiment_label?:
            | "insufficient_signal"
            | "mixed"
            | "negative"
            | "positive"
            | null;
          sentiment_score?: number | null;
          sources?: Json;
          status?: "failed" | "insufficient_signal" | "succeeded";
          summary_en?: string | null;
        };
        Update: {
          article_count?: number;
          confidence_score?: number | null;
          created_at?: string;
          error_message?: string | null;
          id?: string;
          initiative_id?: string;
          model?: string;
          prompt_version?: string;
          scheduled_for?: string;
          sentiment_label?:
            | "insufficient_signal"
            | "mixed"
            | "negative"
            | "positive"
            | null;
          sentiment_score?: number | null;
          sources?: Json;
          status?: "failed" | "insufficient_signal" | "succeeded";
          summary_en?: string | null;
        };
        Relationships: [];
      };
      initiatives: {
        Row: {
          created_at: string;
          id: string;
          market_closes_at: string;
          official_title: string;
          slug: string;
          source_locale: string;
          source_url: string;
          status: "archived" | "draft" | "published";
          summary_en: string;
          type: string;
          updated_at: string;
          vote_date: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          market_closes_at: string;
          official_title: string;
          slug: string;
          source_locale?: string;
          source_url: string;
          status?: "archived" | "draft" | "published";
          summary_en: string;
          type: string;
          updated_at?: string;
          vote_date: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          market_closes_at?: string;
          official_title?: string;
          slug?: string;
          source_locale?: string;
          source_url?: string;
          status?: "archived" | "draft" | "published";
          summary_en?: string;
          type?: string;
          updated_at?: string;
          vote_date?: string;
        };
        Relationships: [];
      };
      metric_versions: {
        Row: {
          ai_model: string | null;
          ai_rationale: string | null;
          approved_at: string | null;
          approved_by: string | null;
          components: Json;
          created_at: string;
          created_by: string | null;
          id: string;
          index_name: string;
          initiative_id: string;
          scale: string;
          source_notes: string | null;
          status: "approved" | "draft" | "rejected";
          target_year: number;
        };
        Insert: {
          ai_model?: string | null;
          ai_rationale?: string | null;
          approved_at?: string | null;
          approved_by?: string | null;
          components: Json;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          index_name: string;
          initiative_id: string;
          scale?: string;
          source_notes?: string | null;
          status?: "approved" | "draft" | "rejected";
          target_year?: number;
        };
        Update: {
          ai_model?: string | null;
          ai_rationale?: string | null;
          approved_at?: string | null;
          approved_by?: string | null;
          components?: Json;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          index_name?: string;
          initiative_id?: string;
          scale?: string;
          source_notes?: string | null;
          status?: "approved" | "draft" | "rejected";
          target_year?: number;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          created_at: string;
          role: "admin";
          user_id: string;
        };
        Insert: {
          created_at?: string;
          role?: "admin";
          user_id: string;
        };
        Update: {
          created_at?: string;
          role?: "admin";
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

type PublicSchema = Database["public"];

export type Tables<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Row"];

export type Inserts<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Insert"];

export type Updates<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Update"];
