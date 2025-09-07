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
          stack_user_id: string | null;
          email: string;
          username: string;
          password_hash: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          stack_user_id?: string | null;
          email: string;
          username: string;
          password_hash?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          stack_user_id?: string | null;
          email?: string;
          username?: string;
          password_hash?: string | null;
          avatar_url?: string | null;
          updated_at?: string;
        };
      };
      leagues: {
        Row: {
          id: string;
          name: string;
          commissioner_id: string;
          settings: Json;
          scoring_system: Json;
          draft_date: string | null;
          season_year: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          commissioner_id: string;
          settings?: Json;
          scoring_system?: Json;
          draft_date?: string | null;
          season_year?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          commissioner_id?: string;
          settings?: Json;
          scoring_system?: Json;
          draft_date?: string | null;
          season_year?: number;
          updated_at?: string;
        };
      };
      teams: {
        Row: {
          id: string;
          league_id: string;
          user_id: string;
          team_name: string;
          draft_position: number | null;
          waiver_priority: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          league_id: string;
          user_id: string;
          team_name: string;
          draft_position?: number | null;
          waiver_priority?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          league_id?: string;
          user_id?: string;
          team_name?: string;
          draft_position?: number | null;
          waiver_priority?: number;
          updated_at?: string;
        };
      };
      players: {
        Row: {
          id: string;
          name: string;
          position: string;
          nfl_team: string;
          stats: Json;
          projections: Json;
          injury_status: string | null;
          bye_week: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          position: string;
          nfl_team: string;
          stats?: Json;
          projections?: Json;
          injury_status?: string | null;
          bye_week?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          position?: string;
          nfl_team?: string;
          stats?: Json;
          projections?: Json;
          injury_status?: string | null;
          bye_week?: number;
          updated_at?: string;
        };
      };
      rosters: {
        Row: {
          id: string;
          team_id: string;
          player_id: string;
          position: string;
          week: number;
          is_starter: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          player_id: string;
          position: string;
          week?: number;
          is_starter?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          team_id?: string;
          player_id?: string;
          position?: string;
          week?: number;
          is_starter?: boolean;
          updated_at?: string;
        };
      };
      lineup_entries: {
        Row: {
          id: string;
          team_id: string;
          player_id: string;
          week: number;
          position: string;
          points: number | null;
          is_locked: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          player_id: string;
          week: number;
          position: string;
          points?: number | null;
          is_locked?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          team_id?: string;
          player_id?: string;
          week?: number;
          position?: string;
          points?: number | null;
          is_locked?: boolean;
          updated_at?: string;
        };
      };
      draft_picks: {
        Row: {
          id: string;
          league_id: string;
          team_id: string;
          player_id: string | null;
          pick_number: number;
          round: number;
          is_keeper: boolean;
          draft_time: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          league_id: string;
          team_id: string;
          player_id?: string | null;
          pick_number: number;
          round: number;
          is_keeper?: boolean;
          draft_time?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          league_id?: string;
          team_id?: string;
          player_id?: string | null;
          pick_number?: number;
          round?: number;
          is_keeper?: boolean;
          draft_time?: string | null;
          updated_at?: string;
        };
      };
      waiver_claims: {
        Row: {
          id: string;
          team_id: string;
          player_id: string;
          drop_player_id: string | null;
          claim_priority: number;
          week: number;
          status: string;
          processed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          player_id: string;
          drop_player_id?: string | null;
          claim_priority: number;
          week: number;
          status?: string;
          processed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          team_id?: string;
          player_id?: string;
          drop_player_id?: string | null;
          claim_priority?: number;
          week?: number;
          status?: string;
          processed_at?: string | null;
          updated_at?: string;
        };
      };
      trades: {
        Row: {
          id: string;
          league_id: string;
          initiating_team_id: string;
          target_team_id: string;
          trade_details: Json;
          status: string;
          trade_deadline: string | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          league_id: string;
          initiating_team_id: string;
          target_team_id: string;
          trade_details: Json;
          status?: string;
          trade_deadline?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          league_id?: string;
          initiating_team_id?: string;
          target_team_id?: string;
          trade_details?: Json;
          status?: string;
          trade_deadline?: string | null;
          completed_at?: string | null;
          updated_at?: string;
        };
      };
      player_projections: {
        Row: {
          id: string;
          player_id: string;
          week: number;
          season_year: number;
          projected_points: number;
          projected_stats: Json;
          source: string;
          confidence: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          player_id: string;
          week: number;
          season_year: number;
          projected_points: number;
          projected_stats?: Json;
          source?: string;
          confidence?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          player_id?: string;
          week?: number;
          season_year?: number;
          projected_points?: number;
          projected_stats?: Json;
          source?: string;
          confidence?: number | null;
          updated_at?: string;
        };
      };
      player_stats: {
        Row: {
          id: string;
          player_id: string;
          week: number;
          season_year: number;
          game_stats: Json;
          fantasy_points: number;
          is_final: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          player_id: string;
          week: number;
          season_year: number;
          game_stats?: Json;
          fantasy_points?: number;
          is_final?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          player_id?: string;
          week?: number;
          season_year?: number;
          game_stats?: Json;
          fantasy_points?: number;
          is_final?: boolean;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
