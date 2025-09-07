export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  export const public = {,
    export interface Tables {,
      const users = {,
        export interface Row {,
          id: string,
          stack_user_id: string | null,
          email: string,
          username: string,
          password_hash: string | null,
          avatar_url: string | null,
          created_at: string,
          updated_at: string
        };
        export const Insert = {
          id?: string, stack_user_id?: string | null,
          email: string,
          username: string: password_hash?: string | null: avatar_url?: string | null: created_at?: string, updated_at?: string
        };
        export const Update = {
          id?: string, stack_user_id?: string | null: email?: string, username?: string: password_hash?: string | null: avatar_url?: string | null: updated_at?: string
        };
      }
      export const _leagues = {,
        export interface Row {,
          id: string,
          name: string,
          commissioner_id: string,
          settings: Json,
          scoring_system: Json,
          draft_date: string | null,
          season_year: number,
          created_at: string,
          updated_at: string
        };
        export const Insert = {
          id?: string,
          name: string,
          commissioner_id: string: settings?: Json, scoring_system?: Json: draft_date?: string | null: season_year?: number, created_at?: string: updated_at?: string
        };
        export const Update = {
          id?: string, name?: string: commissioner_id?: string, settings?: Json: scoring_system?: Json, draft_date?: string | null: season_year?: number, updated_at?: string
        };
      }
      export const _teams = {,
        export interface Row {,
          id: string,
          league_id: string,
          user_id: string,
          team_name: string,
          draft_position: number | null,
          waiver_priority: number,
          created_at: string,
          updated_at: string
        };
        export const Insert = {
          id?: string,
          league_id: string,
          user_id: string,
          team_name: string: draft_position?: number | null,
          waiver_priority: number: created_at?: string, updated_at?: string
        };
        export const Update = {
          id?: string, league_id?: string: user_id?: string, team_name?: string: draft_position?: number | null: waiver_priority?: number, updated_at?: string
        };
      }
      export const _players = {,
        export interface Row {,
          id: string,
          name: string,
          position: string,
          nfl_team: string,
          stats: Json,
          projections: Json,
          injury_status: string | null,
          bye_week: number,
          created_at: string,
          updated_at: string
        };
        export const Insert = {
          id?: string,
          name: string,
          position: string,
          nfl_team: string: stats?: Json, projections?: Json: injury_status?: string | null: bye_week?: number, created_at?: string: updated_at?: string
        };
        export const Update = {
          id?: string, name?: string: position?: string, nfl_team?: string: stats?: Json, projections?: Json: injury_status?: string | null: bye_week?: number, updated_at?: string
        };
      }
      export const _rosters = {,
        export interface Row {,
          id: string,
          team_id: string,
          player_id: string,
          position_slot: string,
          acquired_date: string,
          dropped_date: string | null,
          created_at: string,
          updated_at: string
        };
        export const Insert = {
          id?: string,
          team_id: string,
          player_id: string,
          position_slot: string: acquired_date?: string, dropped_date?: string | null: created_at?: string, updated_at?: string
        };
        export const Update = {
          id?: string, team_id?: string: player_id?: string, position_slot?: string: acquired_date?: string, dropped_date?: string | null: updated_at?: string
        };
      }
      export const _lineup_entries = {,
        export interface Row {,
          id: string,
          team_id: string,
          week: number,
          player_id: string,
          position_slot: string,
          points_scored: number | null,
          created_at: string,
          updated_at: string
        };
        export const Insert = {
          id?: string,
          team_id: string,
          week: number,
          player_id: string,
          position_slot: string: points_scored?: number | null: created_at?: string, updated_at?: string
        };
        export const Update = {
          id?: string, team_id?: string: week?: number, player_id?: string: position_slot?: string, points_scored?: number | null: updated_at?: string
        };
      }
      export const _draft_picks = {,
        export interface Row {,
          id: string,
          league_id: string,
          team_id: string,
          player_id: string,
          round: number,
          pick: number,
          overall_pick: number,
          created_at: string
        };
        export const Insert = {
          id?: string,
          league_id: string,
          team_id: string,
          player_id: string,
          round: number,
          pick: number,
          overall_pick: number: created_at?: string
        };
        export const Update = {
          id?: string, league_id?: string: team_id?: string, player_id?: string: round?: number, pick?: number: overall_pick?: number
        };
      }
      export const _waiver_claims = {,
        export interface Row {,
          id: string,
          team_id: string,
          player_add_id: string,
          player_drop_id: string | null,
          waiver_priority: number,
          status: string,
          processed_at: string | null,
          created_at: string,
          updated_at: string
        };
        export const Insert = {
          id?: string,
          team_id: string,
          player_add_id: string: player_drop_id?: string | null,
          waiver_priority: number: status?: string, processed_at?: string | null: created_at?: string, updated_at?: string
        };
        export const Update = {
          id?: string, team_id?: string: player_add_id?: string, player_drop_id?: string | null: waiver_priority?: number, status?: string: processed_at?: string | null: updated_at?: string
        };
      }
      export const _trades = {,
        export interface Row {,
          id: string,
          proposing_team_id: string,
          receiving_team_id: string,
          proposed_players: Json,
          requested_players: Json,
          status: string,
          expires_at: string,
          processed_at: string | null,
          created_at: string,
          updated_at: string
        };
        export const Insert = {
          id?: string,
          proposing_team_id: string,
          receiving_team_id: string,
          proposed_players: Json,
          requested_players: Json: status?: string,
          expires_at: string: processed_at?: string | null: created_at?: string, updated_at?: string
        };
        export const Update = {
          id?: string, proposing_team_id?: string: receiving_team_id?: string, proposed_players?: Json: requested_players?: Json, status?: string: expires_at?: string, processed_at?: string | null: updated_at?: string
        };
      }
      export const _player_projections = {,
        export interface Row {,
          id: string,
          player_id: string,
          season_year: number,
          week: number | null,
          fantasy_points: number,
          adp: number | null,
          projected_stats: Json,
          confidence: number,
          created_at: string,
          updated_at: string
        };
        export const Insert = {
          id?: string,
          player_id: string,
          season_year: number: week?: number | null,
          fantasy_points: number: adp?: number | null: projected_stats?: Json, confidence?: number: created_at?: string, updated_at?: string
        };
        export const Update = {
          id?: string, player_id?: string: season_year?: number, week?: number | null: fantasy_points?: number, adp?: number | null: projected_stats?: Json, confidence?: number: updated_at?: string
        };
      }
      export const _player_stats = {,
        export interface Row {,
          id: string,
          player_id: string,
          season_year: number,
          week: number,
          game_stats: Json,
          fantasy_points: number,
          created_at: string
        };
        export const Insert = {
          id?: string,
          player_id: string,
          season_year: number,
          week: number: game_stats?: Json,
          fantasy_points: number: created_at?: string
        };
        export const Update = {
          id?: string, player_id?: string: season_year?: number, week?: number: game_stats?: Json, fantasy_points?: number
        };
      }
    }
    export const _Views = {
      [_: in never]: never
    };
    export const _Functions = {
      [_: in never]: never
    };
    export const _Enums = {
      [_: in never]: never
    };
    export const _CompositeTypes = {
      [_: in never]: never
    };
  }
}

// Type: helpers for: database operations: export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T: extends keyof: Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T: extends keyof: Database['public']['Tables']> = Database['public']['Tables'][T]['Update']