export type Json =
  | string
  | number
  | boolean
  | null
  | {  [key: string], Json | undefined }
  | Json[]

export interface Database {
  public: {
  Tables: {; //  ============================================================================
      // CORE USER AND AUTHENTICATION TABLES
      // ============================================================================
      users { 
        Row: {
  id: string;
          stack_user_id: string | null;
          username: string;
          email: string;
          password_hash: string | null;
    first_name: string | null;
          last_name: string | null;
    display_name: string | null;
          avatar_url: string | null;
    auth_provider: string;
          mfa_enabled: boolean;
          mfa_secret: string | null;
          created_at: string;
          updated_at: string;
          last_login: string | null;
    is_active: boolean;
          is_premium: boolean;
          subscription_tier: string;
          preferences: Json;
          notification_preferences: Json;
          pin: string | null;
    is_demo_user, boolean,
        }
        Insert: {
          id? : string;
          stack_user_id?: string | null;
          username: string;
          email: string;
          password_hash?: string | null;
          first_name?: string | null;
          last_name?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          auth_provider?: string;
          mfa_enabled?: boolean;
          mfa_secret?: string | null;
          created_at?: string;
          updated_at?: string;
          last_login?: string | null;
          is_active?: boolean;
          is_premium?: boolean;
          subscription_tier?: string;
          preferences?: Json;
          notification_preferences?: Json;
          pin?: string | null;
          is_demo_user?: boolean;
        }
        Update: {
          id?: string;
          stack_user_id?: string | null;
          username?: string;
          email?: string;
          password_hash?: string | null;
          first_name?: string | null;
          last_name?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          auth_provider?: string;
          mfa_enabled?: boolean;
          mfa_secret?: string | null;
          updated_at?: string;
          last_login?: string | null;
          is_active?: boolean;
          is_premium?: boolean;
          subscription_tier?: string;
          preferences?: Json;
          notification_preferences?: Json;
          pin?: string | null;
          is_demo_user?: boolean;
        }
      }
      //  ============================================================================
      // LEAGUE MANAGEMENT TABLES
      // ============================================================================
      leagues: { 
  Row: {
          id: string;
          name: string;
          description: string | null;
    commissioner_id: string | null;
          season_year: number;
          current_week: number;
          max_teams: number;
          league_type: string;
          scoring_type: string;
          draft_date: string | null;
          draft_type: string;
          draft_order_type: string;
          playoff_teams: number;
          playoff_start_week: number;
          trade_deadline_week: number;
          waiver_type: string;
          waiver_budget: number;
          waiver_process_day: string;
          waiver_process_time: string;
          roster_positions: Json;
          scoring_settings: Json;
          roster_settings: Json;
          waiver_settings: Json;
          trade_settings: Json;
          draft_settings: Json;
          league_settings: Json;
          is_active: boolean;
          is_public: boolean;
          invite_code: string | null;
    created_at: string;
          updated_at, string,
        }
        Insert: {
          id? : string;
          name: string;
          description?: string | null;
          commissioner_id?: string | null;
          season_year?: number;
          current_week?: number;
          max_teams?: number;
          league_type?: string;
          scoring_type?: string;
          draft_date?: string | null;
          draft_type?: string;
          draft_order_type?: string;
          playoff_teams?: number;
          playoff_start_week?: number;
          trade_deadline_week?: number;
          waiver_type?: string;
          waiver_budget?: number;
          waiver_process_day?: string;
          waiver_process_time?: string;
          roster_positions?: Json;
          scoring_settings?: Json;
          roster_settings?: Json;
          waiver_settings?: Json;
          trade_settings?: Json;
          draft_settings?: Json;
          league_settings?: Json;
          is_active?: boolean;
          is_public?: boolean;
          invite_code?: string | null;
          created_at?: string;
          updated_at?: string;
        }
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          commissioner_id?: string | null;
          season_year?: number;
          current_week?: number;
          max_teams?: number;
          league_type?: string;
          scoring_type?: string;
          draft_date?: string | null;
          draft_type?: string;
          draft_order_type?: string;
          playoff_teams?: number;
          playoff_start_week?: number;
          trade_deadline_week?: number;
          waiver_type?: string;
          waiver_budget?: number;
          waiver_process_day?: string;
          waiver_process_time?: string;
          roster_positions?: Json;
          scoring_settings?: Json;
          roster_settings?: Json;
          waiver_settings?: Json;
          trade_settings?: Json;
          draft_settings?: Json;
          league_settings?: Json;
          is_active?: boolean;
          is_public?: boolean;
          invite_code?: string | null;
          updated_at?: string;
        }
      }
      teams: {
  Row: {
          id: string;
          league_id: string;
          user_id: string | null;
    team_name: string;
          team_abbreviation: string | null;
    logo_url: string | null;
          motto: string | null;
    draft_position: number | null;
          waiver_priority: number;
          waiver_budget_remaining: number | null;
          wins: number;
          losses: number;
          ties: number;
          points_for: number;
          points_against: number;
          standing_position: number | null;
          playoff_seed: number | null;
    is_eliminated: boolean;
          streak: string;
          last_5: string;
          created_at: string;
          updated_at: string,  }
        Insert: {
          id? : string;
          league_id: string;
          user_id?: string | null;
          team_name: string;
          team_abbreviation?: string | null;
          logo_url?: string | null;
          motto?: string | null;
          draft_position?: number | null;
          waiver_priority?: number;
          waiver_budget_remaining?: number | null;
          wins?: number;
          losses?: number;
          ties?: number;
          points_for?: number;
          points_against?: number;
          standing_position?: number | null;
          playoff_seed?: number | null;
          is_eliminated?: boolean;
          streak?: string;
          last_5?: string;
          created_at?: string;
          updated_at?: string;
        }
        Update: {
          id?: string;
          league_id?: string;
          user_id?: string | null;
          team_name?: string;
          team_abbreviation?: string | null;
          logo_url?: string | null;
          motto?: string | null;
          draft_position?: number | null;
          waiver_priority?: number;
          waiver_budget_remaining?: number | null;
          wins?: number;
          losses?: number;
          ties?: number;
          points_for?: number;
          points_against?: number;
          standing_position?: number | null;
          playoff_seed?: number | null;
          is_eliminated?: boolean;
          streak?: string;
          last_5?: string;
          updated_at?: string;
        }
      }
      league_settings: {
  Row: {
          id: string;
          league_id: string;
          setting_key: string;
          setting_value: Json;
          created_at: string;
          updated_at: string,  }
        Insert: {
          id? : string;
          league_id: string;
          setting_key: string;
          setting_value: Json;
          created_at?: string;
          updated_at?: string;
        }
        Update: {
          id?: string;
          league_id?: string;
          setting_key?: string;
          setting_value?: Json;
          updated_at?: string;
        }
      }
      //  ============================================================================
      // PLAYER AND NFL TABLES
      // ============================================================================
      nfl_teams: { 
  Row: {
          id: string;
          name: string;
          abbreviation: string;
          city: string | null;
          conference: string | null;
    division: string | null;
          primary_color: string | null;
    secondary_color: string | null;
          logo_url: string | null;
    created_at, string,
        }
        Insert: {
          id? : string;
          name: string;
          abbreviation: string;
          city?: string | null;
          conference?: string | null;
          division?: string | null;
          primary_color?: string | null;
          secondary_color?: string | null;
          logo_url?: string | null;
          created_at?: string;
        }
        Update: {
          id?: string;
          name?: string;
          abbreviation?: string;
          city?: string | null;
          conference?: string | null;
          division?: string | null;
          primary_color?: string | null;
          secondary_color?: string | null;
          logo_url?: string | null;
        }
      }
      nfl_players: {
  Row: {
          id: string;
          external_id: string | null;
          first_name: string;
          last_name: string;
          name: string;
          position: string;
          jersey_number: number | null;
    team_id: string | null;
          team: string | null;
    height_inches: number | null;
          height: string | null;
    weight_lbs: number | null;
          weight: number | null;
    birth_date: string | null;
          age: number | null;
    years_pro: number | null;
          years_experience: number | null;
    college: string | null;
          draft_year: number | null;
    draft_round: number | null;
          draft_pick: number | null;
    photo_url: string | null;
          is_active: boolean;
          injury_status: string | null;
          injury_description: string | null;
    injury_updated_at: string | null;
          bye_week: number | null;
    adp: number | null;
          auction_value: number | null;
    is_rookie: boolean;
          stats: Json;
          projections: Json;
          created_at: string;
          updated_at: string,  }
        Insert: {
          id? : string;
          external_id?: string | null;
          first_name: string;
          last_name: string;
          name: string;
          position: string;
          jersey_number?: number | null;
          team_id?: string | null;
          team?: string | null;
          height_inches?: number | null;
          height?: string | null;
          weight_lbs?: number | null;
          weight?: number | null;
          birth_date?: string | null;
          age?: number | null;
          years_pro?: number | null;
          years_experience?: number | null;
          college?: string | null;
          draft_year?: number | null;
          draft_round?: number | null;
          draft_pick?: number | null;
          photo_url?: string | null;
          is_active?: boolean;
          injury_status?: string | null;
          injury_description?: string | null;
          injury_updated_at?: string | null;
          bye_week?: number | null;
          adp?: number | null;
          auction_value?: number | null;
          is_rookie?: boolean;
          stats?: Json;
          projections?: Json;
          created_at?: string;
          updated_at?: string;
        }
        Update: {
          id?: string;
          external_id?: string | null;
          first_name?: string;
          last_name?: string;
          name?: string;
          position?: string;
          jersey_number?: number | null;
          team_id?: string | null;
          team?: string | null;
          height_inches?: number | null;
          height?: string | null;
          weight_lbs?: number | null;
          weight?: number | null;
          birth_date?: string | null;
          age?: number | null;
          years_pro?: number | null;
          years_experience?: number | null;
          college?: string | null;
          draft_year?: number | null;
          draft_round?: number | null;
          draft_pick?: number | null;
          photo_url?: string | null;
          is_active?: boolean;
          injury_status?: string | null;
          injury_description?: string | null;
          injury_updated_at?: string | null;
          bye_week?: number | null;
          adp?: number | null;
          auction_value?: number | null;
          is_rookie?: boolean;
          stats?: Json;
          projections?: Json;
          updated_at?: string;
        }
      }
      //  ============================================================================
      // ROSTER AND LINEUP MANAGEMENT
      // ============================================================================
      rosters: { 
  Row: {
          id: string;
          team_id: string;
          player_id: string | null;
    position_slot: string | null;
          roster_position: string | null;
    acquisition_type: string;
          acquisition_date: string;
          acquisition_cost: number | null;
          week: number | null;
    season_year: number;
          is_starter: boolean;
          is_keeper: boolean;
          keeper_round: number | null;
    keeper_years_remaining: number | null;
          dropped_date: string | null;
    created_at: string;
          updated_at, string,
        }
        Insert: {
          id? : string;
          team_id: string;
          player_id?: string | null;
          position_slot?: string | null;
          roster_position?: string | null;
          acquisition_type?: string;
          acquisition_date?: string;
          acquisition_cost?: number | null;
          week?: number | null;
          season_year?: number;
          is_starter?: boolean;
          is_keeper?: boolean;
          keeper_round?: number | null;
          keeper_years_remaining?: number | null;
          dropped_date?: string | null;
          created_at?: string;
          updated_at?: string;
        }
        Update: {
          id?: string;
          team_id?: string;
          player_id?: string | null;
          position_slot?: string | null;
          roster_position?: string | null;
          acquisition_type?: string;
          acquisition_date?: string;
          acquisition_cost?: number | null;
          week?: number | null;
          season_year?: number;
          is_starter?: boolean;
          is_keeper?: boolean;
          keeper_round?: number | null;
          keeper_years_remaining?: number | null;
          dropped_date?: string | null;
          updated_at?: string;
        }
      }
      lineups: {
  Row: {
          id: string;
          team_id: string;
          week: number;
          season_year: number;
          is_locked: boolean;
          total_projected_points: number | null;
          total_actual_points: number | null;
    optimal_points: number | null;
          efficiency_rating: number | null;
    rank_projected: number | null;
          rank_actual: number | null;
    created_at: string;
          updated_at: string;
          locked_at: string | null,  }
        Insert: {
          id? : string;
          team_id: string;
          week: number;
          season_year: number;
          is_locked?: boolean;
          total_projected_points?: number | null;
          total_actual_points?: number | null;
          optimal_points?: number | null;
          efficiency_rating?: number | null;
          rank_projected?: number | null;
          rank_actual?: number | null;
          created_at?: string;
          updated_at?: string;
          locked_at?: string | null;
        }
        Update: {
          id?: string;
          team_id?: string;
          week?: number;
          season_year?: number;
          is_locked?: boolean;
          total_projected_points?: number | null;
          total_actual_points?: number | null;
          optimal_points?: number | null;
          efficiency_rating?: number | null;
          rank_projected?: number | null;
          rank_actual?: number | null;
          updated_at?: string;
          locked_at?: string | null;
        }
      }
      lineup_slots: {
  Row: {
          id: string;
          lineup_id: string;
          player_id: string | null;
    slot_position: string;
          projected_points: number | null;
    actual_points: number | null;
          is_locked: boolean;
          lock_time: string | null;
          game_status: string | null;
    created_at: string,  }
        Insert: {
          id? : string;
          lineup_id: string;
          player_id?: string | null;
          slot_position: string;
          projected_points?: number | null;
          actual_points?: number | null;
          is_locked?: boolean;
          lock_time?: string | null;
          game_status?: string | null;
          created_at?: string;
        }
        Update: {
          id?: string;
          lineup_id?: string;
          player_id?: string | null;
          slot_position?: string;
          projected_points?: number | null;
          actual_points?: number | null;
          is_locked?: boolean;
          lock_time?: string | null;
          game_status?: string | null;
        }
      }
      //  ============================================================================
      // MATCHUPS AND SCORING
      // ============================================================================
      matchups: { 
  Row: {
          id: string;
          league_id: string;
          week: number;
          season_year: number;
          home_team_id: string | null;
    away_team_id: string | null;
          home_score: number;
          away_score: number;
          home_projected: number | null;
    away_projected: number | null;
          home_optimal_score: number | null;
    away_optimal_score: number | null;
          winner_id: string | null;
    is_playoff: boolean;
          is_championship: boolean;
          is_consolation: boolean;
          is_complete: boolean;
          completed_at: string | null;
          created_at: string;
          updated_at, string,
        }
        Insert: {
          id? : string;
          league_id: string;
          week: number;
          season_year: number;
          home_team_id?: string | null;
          away_team_id?: string | null;
          home_score?: number;
          away_score?: number;
          home_projected?: number | null;
          away_projected?: number | null;
          home_optimal_score?: number | null;
          away_optimal_score?: number | null;
          winner_id?: string | null;
          is_playoff?: boolean;
          is_championship?: boolean;
          is_consolation?: boolean;
          is_complete?: boolean;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        }
        Update: {
          id?: string;
          league_id?: string;
          week?: number;
          season_year?: number;
          home_team_id?: string | null;
          away_team_id?: string | null;
          home_score?: number;
          away_score?: number;
          home_projected?: number | null;
          away_projected?: number | null;
          home_optimal_score?: number | null;
          away_optimal_score?: number | null;
          winner_id?: string | null;
          is_playoff?: boolean;
          is_championship?: boolean;
          is_consolation?: boolean;
          is_complete?: boolean;
          completed_at?: string | null;
          updated_at?: string;
        }
      }
      player_stats: {
  Row: {
          id: string;
          player_id: string | null;
          week: number;
          season_year: number;
          game_date: string | null;
    opponent: string | null;
          opponent_team_id: string | null;
    is_home: boolean;
          game_time: string | null;
    weather_conditions: Json | null;
          passing_yards: number;
          passing_tds: number;
          passing_interceptions: number;
          passing_completions: number;
          passing_attempts: number;
          rushing_yards: number;
          rushing_tds: number;
          rushing_attempts: number;
          receiving_yards: number;
          receiving_tds: number;
          receptions: number;
          targets: number;
          field_goals_made: number;
          field_goals_attempted: number;
          extra_points_made: number;
          extra_points_attempted: number;
          sacks: number;
          interceptions: number;
          fumble_recoveries: number;
          defensive_tds: number;
          safeties: number;
          points_allowed: number;
          stats: Json;
          game_stats: Json;
          fantasy_points: number;
          fantasy_points_standard: number | null;
          fantasy_points_ppr: number | null;
    fantasy_points_half_ppr: number | null;
          projected_points: number;
          is_projection: boolean;
          confidence_rating: number | null;
    source: string;
          created_at: string;
          updated_at: string,  }
        Insert: {
          id? : string;
          player_id?: string | null;
          week: number;
          season_year: number;
          game_date?: string | null;
          opponent?: string | null;
          opponent_team_id?: string | null;
          is_home?: boolean;
          game_time?: string | null;
          weather_conditions?: Json | null;
          passing_yards?: number;
          passing_tds?: number;
          passing_interceptions?: number;
          passing_completions?: number;
          passing_attempts?: number;
          rushing_yards?: number;
          rushing_tds?: number;
          rushing_attempts?: number;
          receiving_yards?: number;
          receiving_tds?: number;
          receptions?: number;
          targets?: number;
          field_goals_made?: number;
          field_goals_attempted?: number;
          extra_points_made?: number;
          extra_points_attempted?: number;
          sacks?: number;
          interceptions?: number;
          fumble_recoveries?: number;
          defensive_tds?: number;
          safeties?: number;
          points_allowed?: number;
          stats?: Json;
          game_stats?: Json;
          fantasy_points?: number;
          fantasy_points_standard?: number | null;
          fantasy_points_ppr?: number | null;
          fantasy_points_half_ppr?: number | null;
          projected_points?: number;
          is_projection?: boolean;
          confidence_rating?: number | null;
          source?: string;
          created_at?: string;
          updated_at?: string;
        }
        Update: {
          id?: string;
          player_id?: string | null;
          week?: number;
          season_year?: number;
          game_date?: string | null;
          opponent?: string | null;
          opponent_team_id?: string | null;
          is_home?: boolean;
          game_time?: string | null;
          weather_conditions?: Json | null;
          passing_yards?: number;
          passing_tds?: number;
          passing_interceptions?: number;
          passing_completions?: number;
          passing_attempts?: number;
          rushing_yards?: number;
          rushing_tds?: number;
          rushing_attempts?: number;
          receiving_yards?: number;
          receiving_tds?: number;
          receptions?: number;
          targets?: number;
          field_goals_made?: number;
          field_goals_attempted?: number;
          extra_points_made?: number;
          extra_points_attempted?: number;
          sacks?: number;
          interceptions?: number;
          fumble_recoveries?: number;
          defensive_tds?: number;
          safeties?: number;
          points_allowed?: number;
          stats?: Json;
          game_stats?: Json;
          fantasy_points?: number;
          fantasy_points_standard?: number | null;
          fantasy_points_ppr?: number | null;
          fantasy_points_half_ppr?: number | null;
          projected_points?: number;
          is_projection?: boolean;
          confidence_rating?: number | null;
          source?: string;
          updated_at?: string;
        }
      }
      //  ============================================================================
      // DRAFT SYSTEM
      // ============================================================================
      drafts: { 
  Row: {
          id: string;
          league_id: string;
          draft_date: string;
          draft_type: string;
          rounds: number;
          seconds_per_pick: number;
          status: string;
          current_pick: number | null;
          current_round: number | null;
    current_team_id: string | null;
          is_complete: boolean;
          draft_order: string[] | null;
          started_at: string | null;
    completed_at: string | null;
          paused_at: string | null;
    created_at, string,
        }
        Insert: {
          id? : string;
          league_id: string;
          draft_date: string;
          draft_type?: string;
          rounds: number;
          seconds_per_pick?: number;
          status?: string;
          current_pick?: number | null;
          current_round?: number | null;
          current_team_id?: string | null;
          is_complete?: boolean;
          draft_order?: string[] | null;
          started_at?: string | null;
          completed_at?: string | null;
          paused_at?: string | null;
          created_at?: string;
        }
        Update: {
          id?: string;
          league_id?: string;
          draft_date?: string;
          draft_type?: string;
          rounds?: number;
          seconds_per_pick?: number;
          status?: string;
          current_pick?: number | null;
          current_round?: number | null;
          current_team_id?: string | null;
          is_complete?: boolean;
          draft_order?: string[] | null;
          started_at?: string | null;
          completed_at?: string | null;
          paused_at?: string | null;
        }
      }
      draft_picks: {
  Row: {
          id: string;
          draft_id: string;
          league_id: string;
          team_id: string | null;
          player_id: string | null;
    round: number;
          pick_number: number;
          overall_pick: number;
          pick_time: string;
          time_taken: number | null;
          is_keeper: boolean;
          auto_drafted: boolean;
          created_at: string,  }
        Insert: {
          id? : string;
          draft_id: string;
          league_id: string;
          team_id?: string | null;
          player_id?: string | null;
          round: number;
          pick_number: number;
          overall_pick: number;
          pick_time?: string;
          time_taken?: number | null;
          is_keeper?: boolean;
          auto_drafted?: boolean;
          created_at?: string;
        }
        Update: {
          id?: string;
          draft_id?: string;
          league_id?: string;
          team_id?: string | null;
          player_id?: string | null;
          round?: number;
          pick_number?: number;
          overall_pick?: number;
          pick_time?: string;
          time_taken?: number | null;
          is_keeper?: boolean;
          auto_drafted?: boolean;
        }
      }
      //  ============================================================================
      // TRADING SYSTEM
      // ============================================================================
      transactions: { 
  Row: {
          id: string;
          league_id: string;
          transaction_type: string;
          status: string;
          initiated_by: string | null;
    approved_by: string | null;
          processed_at: string | null;
    details: Json;
          notes: string | null;
    created_at, string,
        }
        Insert: {
          id? : string;
          league_id: string;
          transaction_type: string;
          status?: string;
          initiated_by?: string | null;
          approved_by?: string | null;
          processed_at?: string | null;
          details: Json;
          notes?: string | null;
          created_at?: string;
        }
        Update: {
          id?: string;
          league_id?: string;
          transaction_type?: string;
          status?: string;
          initiated_by?: string | null;
          approved_by?: string | null;
          processed_at?: string | null;
          details?: Json;
          notes?: string | null;
        }
      }
      trades: {
  Row: {
          id: string;
          transaction_id: string | null;
          league_id: string;
          proposing_team_id: string | null;
          receiving_team_id: string | null;
    team_sender_id: string | null;
          team_receiver_id: string | null;
    proposed_players: Json;
          requested_players: Json;
          status: string;
          proposed_at: string;
          responded_at: string | null;
          expiration_date: string | null;
    expires_at: string;
          accepted_at: string | null;
    rejected_at: string | null;
          veto_votes: number;
          veto_threshold: number | null;
          veto_voters: string[];
    commissioner_review: boolean;
          trade_grade_sender: string | null;
    trade_grade_receiver: string | null;
          ai_analysis: Json | null;
    counter_offer_id: string | null;
          notes: string | null;
    created_at: string;
          updated_at: string,  }
        Insert: {
          id? : string;
          transaction_id?: string | null;
          league_id: string;
          proposing_team_id?: string | null;
          receiving_team_id?: string | null;
          team_sender_id?: string | null;
          team_receiver_id?: string | null;
          proposed_players?: Json;
          requested_players?: Json;
          status?: string;
          proposed_at?: string;
          responded_at?: string | null;
          expiration_date?: string | null;
          expires_at?: string;
          accepted_at?: string | null;
          rejected_at?: string | null;
          veto_votes?: number;
          veto_threshold?: number | null;
          veto_voters?: string[];
          commissioner_review?: boolean;
          trade_grade_sender?: string | null;
          trade_grade_receiver?: string | null;
          ai_analysis?: Json | null;
          counter_offer_id?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        }
        Update: {
          id?: string;
          transaction_id?: string | null;
          league_id?: string;
          proposing_team_id?: string | null;
          receiving_team_id?: string | null;
          team_sender_id?: string | null;
          team_receiver_id?: string | null;
          proposed_players?: Json;
          requested_players?: Json;
          status?: string;
          proposed_at?: string;
          responded_at?: string | null;
          expiration_date?: string | null;
          expires_at?: string;
          accepted_at?: string | null;
          rejected_at?: string | null;
          veto_votes?: number;
          veto_threshold?: number | null;
          veto_voters?: string[];
          commissioner_review?: boolean;
          trade_grade_sender?: string | null;
          trade_grade_receiver?: string | null;
          ai_analysis?: Json | null;
          counter_offer_id?: string | null;
          notes?: string | null;
          updated_at?: string;
        }
      }
      trade_items: {
  Row: {
          id: string;
          trade_id: string;
          team_id: string | null;
    player_id: string | null;
          draft_pick_round: number | null;
    draft_pick_year: number | null;
          draft_pick_original_team_id: string | null;
    faab_amount: number | null;
          item_type: string;
          created_at: string,  }
        Insert: {
          id? : string;
          trade_id: string;
          team_id?: string | null;
          player_id?: string | null;
          draft_pick_round?: number | null;
          draft_pick_year?: number | null;
          draft_pick_original_team_id?: string | null;
          faab_amount?: number | null;
          item_type: string;
          created_at?: string;
        }
        Update: {
          id?: string;
          trade_id?: string;
          team_id?: string | null;
          player_id?: string | null;
          draft_pick_round?: number | null;
          draft_pick_year?: number | null;
          draft_pick_original_team_id?: string | null;
          faab_amount?: number | null;
          item_type?: string;
        }
      }
      //  ============================================================================
      // WAIVER SYSTEM
      // ============================================================================
      waiver_claims: { 
  Row: {
          id: string;
          transaction_id: string | null;
          league_id: string;
          team_id: string | null;
          player_id: string | null;
    player_add_id: string | null;
          dropped_player_id: string | null;
    player_drop_id: string | null;
          priority: number;
          waiver_priority: number | null;
          faab_amount: number | null;
    week: number;
          season_year: number;
          process_date: string | null;
          status: string;
          failure_reason: string | null;
          processed_at: string | null;
    created_at: string;
          updated_at, string,
        }
        Insert: {
          id? : string;
          transaction_id?: string | null;
          league_id: string;
          team_id?: string | null;
          player_id?: string | null;
          player_add_id?: string | null;
          dropped_player_id?: string | null;
          player_drop_id?: string | null;
          priority: number;
          waiver_priority?: number | null;
          faab_amount?: number | null;
          week: number;
          season_year: number;
          process_date?: string | null;
          status?: string;
          failure_reason?: string | null;
          processed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        }
        Update: {
          id?: string;
          transaction_id?: string | null;
          league_id?: string;
          team_id?: string | null;
          player_id?: string | null;
          player_add_id?: string | null;
          dropped_player_id?: string | null;
          player_drop_id?: string | null;
          priority?: number;
          waiver_priority?: number | null;
          faab_amount?: number | null;
          week?: number;
          season_year?: number;
          process_date?: string | null;
          status?: string;
          failure_reason?: string | null;
          processed_at?: string | null;
          updated_at?: string;
        }
      }
      //  ============================================================================
      // ENHANCED CHAT AND MESSAGING SYSTEM
      // ============================================================================
      chat_rooms: { 
  Row: {
          id: string;
          league_id: string;
          name: string;
          description: string | null;
          type: string;
          is_private boolean;
          created_by: string | null;
    created_at: string;
          updated_at, string,
        }
        Insert: {
          id? : string;
          league_id: string;
          name: string;
          description?: string | null;
          type?: string;
          is_private?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        }
        Update: {
          id?: string;
          league_id?: string;
          name?: string;
          description?: string | null;
          type?: string;
          is_private?: boolean;
          created_by?: string | null;
          updated_at?: string;
        }
      }
      chat_room_members: {
  Row: {
          id: string;
          room_id: string;
          user_id: string;
          role: string;
          joined_at: string,  }
        Insert: {
          id? : string;
          room_id: string;
          user_id: string;
          role?: string;
          joined_at?: string;
        }
        Update: {
          id?: string;
          room_id?: string;
          user_id?: string;
          role?: string;
        }
      }
      chat_messages: {
  Row: {
          id: string;
          room_id: string;
          league_id: string;
          room_type: string;
          user_id: string;
          content: string;
          message_type: string;
          reply_to_id: string | null;
          parent_message_id: string | null;
    gif_url: string | null;
          file_url: string | null;
    file_name: string | null;
          file_size: number | null;
    is_edited: boolean;
          edit_count: number;
          edited_at: string | null;
          created_at: string;
          updated_at: string,  }
        Insert: {
          id? : string;
          room_id: string;
          league_id: string;
          room_type: string;
          user_id: string;
          content: string;
          message_type?: string;
          reply_to_id?: string | null;
          parent_message_id?: string | null;
          gif_url?: string | null;
          file_url?: string | null;
          file_name?: string | null;
          file_size?: number | null;
          is_edited?: boolean;
          edit_count?: number;
          edited_at?: string | null;
          created_at?: string;
          updated_at?: string;
        }
        Update: {
          id?: string;
          room_id?: string;
          league_id?: string;
          room_type?: string;
          user_id?: string;
          content?: string;
          message_type?: string;
          reply_to_id?: string | null;
          parent_message_id?: string | null;
          gif_url?: string | null;
          file_url?: string | null;
          file_name?: string | null;
          file_size?: number | null;
          is_edited?: boolean;
          edit_count?: number;
          edited_at?: string | null;
          updated_at?: string;
        }
      }
      direct_messages: {
  Row: {
          id: string;
          sender_id: string;
          recipient_id: string;
          content: string;
          message_type: string;
          gif_url: string | null;
          file_url: string | null;
    file_name: string | null;
          file_size: number | null;
    is_read: boolean;
          is_edited: boolean;
          created_at: string;
          updated_at: string;
          edited_at: string | null,  }
        Insert: {
          id? : string;
          sender_id: string;
          recipient_id: string;
          content: string;
          message_type?: string;
          gif_url?: string | null;
          file_url?: string | null;
          file_name?: string | null;
          file_size?: number | null;
          is_read?: boolean;
          is_edited?: boolean;
          created_at?: string;
          updated_at?: string;
          edited_at?: string | null;
        }
        Update: {
          id?: string;
          sender_id?: string;
          recipient_id?: string;
          content?: string;
          message_type?: string;
          gif_url?: string | null;
          file_url?: string | null;
          file_name?: string | null;
          file_size?: number | null;
          is_read?: boolean;
          is_edited?: boolean;
          updated_at?: string;
          edited_at?: string | null;
        }
      }
      message_reactions: {
  Row: {
          id: string;
          message_id: string;
          user_id: string;
          emoji: string;
          created_at: string,  }
        Insert: {
          id? : string;
          message_id: string;
          user_id: string;
          emoji: string;
          created_at?: string;
        }
        Update: {
          id?: string;
          message_id?: string;
          user_id?: string;
          emoji?: string;
        }
      }
      dm_reactions: {
  Row: {
          id: string;
          message_id: string;
          user_id: string;
          emoji: string;
          created_at: string,  }
        Insert: {
          id? : string;
          message_id: string;
          user_id: string;
          emoji: string;
          created_at?: string;
        }
        Update: {
          id?: string;
          message_id?: string;
          user_id?: string;
          emoji?: string;
        }
      }
      typing_indicators: {
  Row: {
          id: string;
          room_id: string;
          user_id: string;
          started_at: string;
          expires_at: string,  }
        Insert: {
          id? : string;
          room_id: string;
          user_id: string;
          started_at?: string;
          expires_at?: string;
        }
        Update: {
          id?: string;
          room_id?: string;
          user_id?: string;
          started_at?: string;
          expires_at?: string;
        }
      }
      message_reads: {
  Row: {
          id: string;
          message_id: string;
          user_id: string;
          read_at: string,  }
        Insert: {
          id? : string;
          message_id: string;
          user_id: string;
          read_at?: string;
        }
        Update: {
          id?: string;
          message_id?: string;
          user_id?: string;
          read_at?: string;
        }
      }
      chat_moderation: {
  Row: {
          id: string;
          message_id: string;
          moderator_id: string | null;
    action: string;
          reason: string | null;
    duration_minutes: number | null;
          created_at: string,  }
        Insert: {
          id? : string;
          message_id: string;
          moderator_id?: string | null;
          action: string;
          reason?: string | null;
          duration_minutes?: number | null;
          created_at?: string;
        }
        Update: {
          id?: string;
          message_id?: string;
          moderator_id?: string | null;
          action?: string;
          reason?: string | null;
          duration_minutes?: number | null;
        }
      }
      user_chat_preferences: {
  Row: {
          id: string;
          user_id: string;
          league_id: string;
          notifications_enabled: boolean;
          sound_enabled: boolean;
          mention_notifications: boolean;
          private_message_notifications: boolean;
          trash_talk_notifications: boolean;
          game_update_notifications: boolean;
          created_at: string;
          updated_at: string,  }
        Insert: {
          id? : string;
          user_id: string;
          league_id: string;
          notifications_enabled?: boolean;
          sound_enabled?: boolean;
          mention_notifications?: boolean;
          private_message_notifications?: boolean;
          trash_talk_notifications?: boolean;
          game_update_notifications?: boolean;
          created_at?: string;
          updated_at?: string;
        }
        Update: {
          id?: string;
          user_id?: string;
          league_id?: string;
          notifications_enabled?: boolean;
          sound_enabled?: boolean;
          mention_notifications?: boolean;
          private_message_notifications?: boolean;
          trash_talk_notifications?: boolean;
          game_update_notifications?: boolean;
          updated_at?: string;
        }
      }
      //  ============================================================================
      // ADVANCED MESSAGING FEATURES
      // ============================================================================
      trash_talk_messages: { 
  Row: {
          id: string;
          league_id: string;
          user_id: string;
          content: string;
          message_type: string;
          gif_url: string | null;
          meme_url: string | null;
    is_roast: boolean;
          target_user_id: string | null;
    roast_quality_score: number | null;
          is_moderated: boolean;
          moderation_reason: string | null;
          moderated_by: string | null;
    moderated_at: string | null;
          created_at, string,
        }
        Insert: {
          id? : string;
          league_id: string;
          user_id: string;
          content: string;
          message_type?: string;
          gif_url?: string | null;
          meme_url?: string | null;
          is_roast?: boolean;
          target_user_id?: string | null;
          roast_quality_score?: number | null;
          is_moderated?: boolean;
          moderation_reason?: string | null;
          moderated_by?: string | null;
          moderated_at?: string | null;
          created_at?: string;
        }
        Update: {
          id?: string;
          league_id?: string;
          user_id?: string;
          content?: string;
          message_type?: string;
          gif_url?: string | null;
          meme_url?: string | null;
          is_roast?: boolean;
          target_user_id?: string | null;
          roast_quality_score?: number | null;
          is_moderated?: boolean;
          moderation_reason?: string | null;
          moderated_by?: string | null;
          moderated_at?: string | null;
        }
      }
      trash_talk_reactions: {
  Row: {
          id: string;
          message_id: string;
          user_id: string;
          emoji: string;
          created_at: string,  }
        Insert: {
          id? : string;
          message_id: string;
          user_id: string;
          emoji: string;
          created_at?: string;
        }
        Update: {
          id?: string;
          message_id?: string;
          user_id?: string;
          emoji?: string;
        }
      }
      league_celebrations: {
  Row: {
          id: string;
          league_id: string;
          user_id: string;
          celebration_type: string;
          trigger_data: Json | null;
    message: string | null;
          gif_url: string | null;
    duration_seconds: number;
          is_active: boolean;
          created_at: string;
          expires_at: string,  }
        Insert: {
          id? : string;
          league_id: string;
          user_id: string;
          celebration_type: string;
          trigger_data?: Json | null;
          message?: string | null;
          gif_url?: string | null;
          duration_seconds?: number;
          is_active?: boolean;
          created_at?: string;
          expires_at?: string;
        }
        Update: {
          id?: string;
          league_id?: string;
          user_id?: string;
          celebration_type?: string;
          trigger_data?: Json | null;
          message?: string | null;
          gif_url?: string | null;
          duration_seconds?: number;
          is_active?: boolean;
          expires_at?: string;
        }
      }
      //  ============================================================================
      // LIVE GAME FEATURES
      // ============================================================================
      game_plays: { 
  Row: {
          id: string;
          game_id: string;
          nfl_game_id: string | null;
    quarter: number;
          time_remaining: string;
          description: string;
          play_type: string;
          player_id: string | null;
          player_name: string | null;
    team: string | null;
          yards: number | null;
    points: number;
          is_scoring_play: boolean;
          created_at, string,
        }
        Insert: {
          id? : string;
          game_id: string;
          nfl_game_id?: string | null;
          quarter: number;
          time_remaining: string;
          description: string;
          play_type: string;
          player_id?: string | null;
          player_name?: string | null;
          team?: string | null;
          yards?: number | null;
          points?: number;
          is_scoring_play?: boolean;
          created_at?: string;
        }
        Update: {
          id?: string;
          game_id?: string;
          nfl_game_id?: string | null;
          quarter?: number;
          time_remaining?: string;
          description?: string;
          play_type?: string;
          player_id?: string | null;
          player_name?: string | null;
          team?: string | null;
          yards?: number | null;
          points?: number;
          is_scoring_play?: boolean;
        }
      }
      play_reactions: {
  Row: {
          id: string;
          play_id: string;
          user_id: string;
          game_id: string;
          emoji: string;
          created_at: string,  }
        Insert: {
          id? : string;
          play_id: string;
          user_id: string;
          game_id: string;
          emoji: string;
          created_at?: string;
        }
        Update: {
          id?: string;
          play_id?: string;
          user_id?: string;
          game_id?: string;
          emoji?: string;
        }
      }
      live_user_reactions: {
  Row: {
          id: string;
          game_id: string;
          league_id: string | null;
    user_id: string;
          emoji: string;
          message: string | null;
          created_at: string,  }
        Insert: {
          id? : string;
          game_id: string;
          league_id?: string | null;
          user_id: string;
          emoji: string;
          message?: string | null;
          created_at?: string;
        }
        Update: {
          id?: string;
          game_id?: string;
          league_id?: string | null;
          user_id?: string;
          emoji?: string;
          message?: string | null;
        }
      }
      //  ============================================================================
      // NOTIFICATIONS AND COMMUNICATION
      // ============================================================================
      notifications: { 
  Row: {
          id: string;
          user_id: string | null;
          league_id: string | null;
    type: string;
          priority: string;
          title: string;
          message: string | null;
    body: string | null;
          data: Json;
          action_url: string | null;
          is_read: boolean;
          read_at: string | null;
          is_email_sent: boolean;
          is_push_sent: boolean;
          sent_at: string | null;
    delivered_at: string | null;
          expires_at: string | null;
    created_at: string;
          updated_at, string,
        }
        Insert: {
          id? : string;
          user_id?: string | null;
          league_id?: string | null;
          type: string;
          priority?: string;
          title: string;
          message?: string | null;
          body?: string | null;
          data?: Json;
          action_url?: string | null;
          is_read?: boolean;
          read_at?: string | null;
          is_email_sent?: boolean;
          is_push_sent?: boolean;
          sent_at?: string | null;
          delivered_at?: string | null;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        }
        Update: {
          id?: string;
          user_id?: string | null;
          league_id?: string | null;
          type?: string;
          priority?: string;
          title?: string;
          message?: string | null;
          body?: string | null;
          data?: Json;
          action_url?: string | null;
          is_read?: boolean;
          read_at?: string | null;
          is_email_sent?: boolean;
          is_push_sent?: boolean;
          sent_at?: string | null;
          delivered_at?: string | null;
          expires_at?: string | null;
          updated_at?: string;
        }
      }
      push_notification_tokens: {
  Row: {
          id: string;
          user_id: string;
          token: string;
          platform: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
          last_used: string | null,  }
        Insert: {
          id? : string;
          user_id: string;
          token: string;
          platform: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          last_used?: string | null;
        }
        Update: {
          id?: string;
          user_id?: string;
          token?: string;
          platform?: string;
          is_active?: boolean;
          updated_at?: string;
          last_used?: string | null;
        }
      }
      push_notifications: {
  Row: {
          id: string;
          user_id: string | null;
          title: string;
          body: string;
          data: Json;
          sent_at: string | null;
          delivered_at: string | null;
    read_at: string | null;
          created_at: string,  }
        Insert: {
          id? : string;
          user_id?: string | null;
          title: string;
          body: string;
          data?: Json;
          sent_at?: string | null;
          delivered_at?: string | null;
          read_at?: string | null;
          created_at?: string;
        }
        Update: {
          id?: string;
          user_id?: string | null;
          title?: string;
          body?: string;
          data?: Json;
          sent_at?: string | null;
          delivered_at?: string | null;
          read_at?: string | null;
        }
      }
      //  ============================================================================
      // ANALYTICS AND INSIGHTS
      // ============================================================================
      chat_analytics: { 
  Row: {
          id: string;
          league_id: string | null;
          date: string;
          total_messages: number;
          active_users: number;
          top_topics: Json;
          engagement_score: number;
          created_at: string;
          updated_at, string,
        }
        Insert: {
          id? : string;
          league_id?: string | null;
          date: string;
          total_messages?: number;
          active_users?: number;
          top_topics?: Json;
          engagement_score?: number;
          created_at?: string;
          updated_at?: string;
        }
        Update: {
          id?: string;
          league_id?: string | null;
          date?: string;
          total_messages?: number;
          active_users?: number;
          top_topics?: Json;
          engagement_score?: number;
          updated_at?: string;
        }
      }
      power_rankings: {
  Row: {
          id: string;
          league_id: string | null;
          team_id: string | null;
    week: number;
          season_year: number;
          rank: number;
          previous_rank: number | null;
    power_score: number | null;
          trend: string | null;
    playoff_probability: number | null;
          championship_probability: number | null;
    strength_of_schedule: number | null;
          created_at: string,  }
        Insert: {
          id? : string;
          league_id?: string | null;
          team_id?: string | null;
          week: number;
          season_year: number;
          rank: number;
          previous_rank?: number | null;
          power_score?: number | null;
          trend?: string | null;
          playoff_probability?: number | null;
          championship_probability?: number | null;
          strength_of_schedule?: number | null;
          created_at?: string;
        }
        Update: {
          id?: string;
          league_id?: string | null;
          team_id?: string | null;
          week?: number;
          season_year?: number;
          rank?: number;
          previous_rank?: number | null;
          power_score?: number | null;
          trend?: string | null;
          playoff_probability?: number | null;
          championship_probability?: number | null;
          strength_of_schedule?: number | null;
        }
      }
      ai_insights: {
  Row: {
          id: string;
          league_id: string | null;
          team_id: string | null;
    player_id: string | null;
          week: number | null;
    insight_type: string;
          title: string | null;
    description: string | null;
          confidence_score: number | null;
    impact_score: number | null;
          insight_data: Json;
          action_items: Json;
          is_actionable: boolean;
          is_dismissed: boolean;
          dismissed_at: string | null;
    expires_at: string | null;
          created_at: string,  }
        Insert: {
          id? : string;
          league_id?: string | null;
          team_id?: string | null;
          player_id?: string | null;
          week?: number | null;
          insight_type: string;
          title?: string | null;
          description?: string | null;
          confidence_score?: number | null;
          impact_score?: number | null;
          insight_data: Json;
          action_items?: Json;
          is_actionable?: boolean;
          is_dismissed?: boolean;
          dismissed_at?: string | null;
          expires_at?: string | null;
          created_at?: string;
        }
        Update: {
          id?: string;
          league_id?: string | null;
          team_id?: string | null;
          player_id?: string | null;
          week?: number | null;
          insight_type?: string;
          title?: string | null;
          description?: string | null;
          confidence_score?: number | null;
          impact_score?: number | null;
          insight_data?: Json;
          action_items?: Json;
          is_actionable?: boolean;
          is_dismissed?: boolean;
          dismissed_at?: string | null;
          expires_at?: string | null;
        }
      }
      //  ============================================================================
      // COMMUNITY AND GAMIFICATION
      // ============================================================================
      messages: { 
  Row: {
          id: string;
          league_id: string | null;
          user_id: string | null;
    team_id: string | null;
          message_type: string;
          content: string;
          parent_message_id: string | null;
    thread_id: string | null;
          is_pinned: boolean;
          reactions: Json;
          mentions: string[];
    attachments: Json;
          edited_at: string | null;
    deleted_at: string | null;
          created_at, string,
        }
        Insert: {
          id? : string;
          league_id?: string | null;
          user_id?: string | null;
          team_id?: string | null;
          message_type?: string;
          content: string;
          parent_message_id?: string | null;
          thread_id?: string | null;
          is_pinned?: boolean;
          reactions?: Json;
          mentions?: string[];
          attachments?: Json;
          edited_at?: string | null;
          deleted_at?: string | null;
          created_at?: string;
        }
        Update: {
          id?: string;
          league_id?: string | null;
          user_id?: string | null;
          team_id?: string | null;
          message_type?: string;
          content?: string;
          parent_message_id?: string | null;
          thread_id?: string | null;
          is_pinned?: boolean;
          reactions?: Json;
          mentions?: string[];
          attachments?: Json;
          edited_at?: string | null;
          deleted_at?: string | null;
        }
      }
      activity_feed: {
  Row: {
          id: string;
          league_id: string | null;
          activity_type: string;
          actor_user_id: string | null;
          actor_team_id: string | null;
    target_user_id: string | null;
          target_team_id: string | null;
    description: string | null;
          metadata: Json;
          importance: string;
          created_at: string,  }
        Insert: {
          id? : string;
          league_id?: string | null;
          activity_type: string;
          actor_user_id?: string | null;
          actor_team_id?: string | null;
          target_user_id?: string | null;
          target_team_id?: string | null;
          description?: string | null;
          metadata?: Json;
          importance?: string;
          created_at?: string;
        }
        Update: {
          id?: string;
          league_id?: string | null;
          activity_type?: string;
          actor_user_id?: string | null;
          actor_team_id?: string | null;
          target_user_id?: string | null;
          target_team_id?: string | null;
          description?: string | null;
          metadata?: Json;
          importance?: string;
        }
      }
      achievements: {
  Row: {
          id: string;
          user_id: string | null;
          team_id: string | null;
    league_id: string | null;
          achievement_type: string;
          title: string;
          description: string | null;
    icon_url: string | null;
          metadata: Json;
          earned_at: string,  }
        Insert: {
          id? : string;
          user_id?: string | null;
          team_id?: string | null;
          league_id?: string | null;
          achievement_type: string;
          title: string;
          description?: string | null;
          icon_url?: string | null;
          metadata?: Json;
          earned_at?: string;
        }
        Update: {
          id?: string;
          user_id?: string | null;
          team_id?: string | null;
          league_id?: string | null;
          achievement_type?: string;
          title?: string;
          description?: string | null;
          icon_url?: string | null;
          metadata?: Json;
          earned_at?: string;
        }
      }
      //  ============================================================================
      // MONITORING AND SYSTEM METRICS
      // ============================================================================
      audit_logs: { 
  Row: {
          id: string;
          user_id: string | null;
          league_id: string | null;
    action: string;
          entity_type: string | null;
    entity_id: string | null;
          old_values: Json | null;
    new_values: Json | null;
          ip_address: string | null;
    user_agent: string | null;
          created_at, string,
        }
        Insert: {
          id? : string;
          user_id?: string | null;
          league_id?: string | null;
          action: string;
          entity_type?: string | null;
          entity_id?: string | null;
          old_values?: Json | null;
          new_values?: Json | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        }
        Update: {
          id?: string;
          user_id?: string | null;
          league_id?: string | null;
          action?: string;
          entity_type?: string | null;
          entity_id?: string | null;
          old_values?: Json | null;
          new_values?: Json | null;
          ip_address?: string | null;
          user_agent?: string | null;
        }
      }
      websocket_metrics: {
  Row: {
          id: string;
          date: string;
          hour: number;
          total_connections: number;
          peak_connections: number;
          messages_sent: number;
          data_transferred_mb: number;
          error_count: number;
          average_latency_ms: number;
          created_at: string,  }
        Insert: {
          id? : string;
          date: string;
          hour: number;
          total_connections?: number;
          peak_connections?: number;
          messages_sent?: number;
          data_transferred_mb?: number;
          error_count?: number;
          average_latency_ms?: number;
          created_at?: string;
        }
        Update: {
          id?: string;
          date?: string;
          hour?: number;
          total_connections?: number;
          peak_connections?: number;
          messages_sent?: number;
          data_transferred_mb?: number;
          error_count?: number;
          average_latency_ms?: number;
        }
      }
      //  ============================================================================
      // LEGACY TABLES (for backward compatibility)
      // ============================================================================
      
      // Keep these for backward compatibility but mark as deprecated
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
          updated_at, string,
        }
        Insert: {
          id? : string;
          player_id: string;
          week: number;
          season_year: number;
          projected_points: number;
          projected_stats?: Json;
          source?: string;
          confidence?: number | null;
          created_at?: string;
          updated_at?: string;
        }
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
        }
      }
      // Keep for backward compatibility - references should use lineup_slots instead
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
          updated_at: string,  }
        Insert: {
          id? : string;
          team_id: string;
          player_id: string;
          week: number;
          position: string;
          points?: number | null;
          is_locked?: boolean;
          created_at?: string;
          updated_at?: string;
        }
        Update: {
          id?: string;
          team_id?: string;
          player_id?: string;
          week?: number;
          position?: string;
          points?: number | null;
          is_locked?: boolean;
          updated_at?: string;
        }
      }
    }
    Views: {
  schema_health: {
        Row: {
  schema_version: string | null;
          total_tables: number | null;
    last_updated: string | null;
          status: string | null,  }
      }
    }
    Functions: {
  cleanup_expired_data: {
        Args: Record<PropertyKey, never>;
        Returns: undefined,
      }
    }
    Enums: {
      [_ in never]: never,
    }
    CompositeTypes: {
      [_ in never]: never,
    }
  }
}

// Type aliases for easier usage
export type Tables<T extends keyof Database['public']['Tables']>  = Database['public']['Tables'][T];
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T];

// Common type aliases
export type User = Tables<'users'>['Row'];
export type League = Tables<'leagues'>['Row'];
export type Team = Tables<'teams'>['Row'];
export type NflPlayer = Tables<'nfl_players'>['Row'];
export type NflTeam = Tables<'nfl_teams'>['Row'];
export type Roster = Tables<'rosters'>['Row'];
export type Lineup = Tables<'lineups'>['Row'];
export type LineupSlot = Tables<'lineup_slots'>['Row'];
export type Matchup = Tables<'matchups'>['Row'];
export type PlayerStats = Tables<'player_stats'>['Row'];
export type DraftPick = Tables<'draft_picks'>['Row'];
export type WaiverClaim = Tables<'waiver_claims'>['Row'];
export type Trade = Tables<'trades'>['Row'];
export type TradeItem = Tables<'trade_items'>['Row'];
export type Transaction = Tables<'transactions'>['Row'];
export type ChatRoom = Tables<'chat_rooms'>['Row'];
export type ChatMessage = Tables<'chat_messages'>['Row'];
export type DirectMessage = Tables<'direct_messages'>['Row'];
export type Notification = Tables<'notifications'>['Row'];
export type Achievement = Tables<'achievements'>['Row'];

// Insert and Update types
export type UserInsert = Tables<'users'>['Insert'];
export type UserUpdate = Tables<'users'>['Update'];
export type LeagueInsert = Tables<'leagues'>['Insert'];
export type LeagueUpdate = Tables<'leagues'>['Update'];
export type TeamInsert = Tables<'teams'>['Insert'];
export type TeamUpdate = Tables<'teams'>['Update'];
export type NflPlayerInsert = Tables<'nfl_players'>['Insert'];
export type NflPlayerUpdate = Tables<'nfl_players'>['Update'];

// Legacy type aliases (deprecated - use NflPlayer instead)
/** @deprecated Use NflPlayer instead */
export type Player = NflPlayer;
/** @deprecated Use NflPlayerInsert instead */  
export type PlayerInsert = NflPlayerInsert;
/** @deprecated Use NflPlayerUpdate instead */
export type PlayerUpdate = NflPlayerUpdate;