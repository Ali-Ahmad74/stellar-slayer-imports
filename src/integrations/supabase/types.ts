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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      batting_inputs: {
        Row: {
          balls: number
          batting_position: number | null
          created_at: string
          dismissal_type: string | null
          fours: number
          id: number
          match_id: number
          out: boolean
          player_id: number
          runs: number
          season_id: number | null
          sixes: number
        }
        Insert: {
          balls?: number
          batting_position?: number | null
          created_at?: string
          dismissal_type?: string | null
          fours?: number
          id?: number
          match_id: number
          out?: boolean
          player_id: number
          runs?: number
          season_id?: number | null
          sixes?: number
        }
        Update: {
          balls?: number
          batting_position?: number | null
          created_at?: string
          dismissal_type?: string | null
          fours?: number
          id?: number
          match_id?: number
          out?: boolean
          player_id?: number
          runs?: number
          season_id?: number | null
          sixes?: number
        }
        Relationships: [
          {
            foreignKeyName: "batting_inputs_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "batting_inputs_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "player_stats"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "batting_inputs_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "batting_inputs_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      bowling_inputs: {
        Row: {
          balls: number
          created_at: string
          dot_balls: number
          fours_conceded: number
          hat_tricks: number
          id: number
          maidens: number
          match_id: number
          no_balls: number
          player_id: number
          runs_conceded: number
          season_id: number | null
          sixes_conceded: number
          wickets: number
          wides: number
        }
        Insert: {
          balls?: number
          created_at?: string
          dot_balls?: number
          fours_conceded?: number
          hat_tricks?: number
          id?: number
          maidens?: number
          match_id: number
          no_balls?: number
          player_id: number
          runs_conceded?: number
          season_id?: number | null
          sixes_conceded?: number
          wickets?: number
          wides?: number
        }
        Update: {
          balls?: number
          created_at?: string
          dot_balls?: number
          fours_conceded?: number
          hat_tricks?: number
          id?: number
          maidens?: number
          match_id?: number
          no_balls?: number
          player_id?: number
          runs_conceded?: number
          season_id?: number | null
          sixes_conceded?: number
          wickets?: number
          wides?: number
        }
        Relationships: [
          {
            foreignKeyName: "bowling_inputs_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bowling_inputs_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "player_stats"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "bowling_inputs_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bowling_inputs_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      fielding_inputs: {
        Row: {
          catches: number
          created_at: string
          dropped_catches: number
          id: number
          match_id: number
          player_id: number
          runouts: number
          season_id: number | null
          stumpings: number
        }
        Insert: {
          catches?: number
          created_at?: string
          dropped_catches?: number
          id?: number
          match_id: number
          player_id: number
          runouts?: number
          season_id?: number | null
          stumpings?: number
        }
        Update: {
          catches?: number
          created_at?: string
          dropped_catches?: number
          id?: number
          match_id?: number
          player_id?: number
          runouts?: number
          season_id?: number | null
          stumpings?: number
        }
        Relationships: [
          {
            foreignKeyName: "fielding_inputs_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fielding_inputs_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "player_stats"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "fielding_inputs_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fielding_inputs_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      match_attendance: {
        Row: {
          attended: boolean
          created_at: string
          id: string
          match_id: number
          player_id: number
        }
        Insert: {
          attended?: boolean
          created_at?: string
          id?: string
          match_id: number
          player_id: number
        }
        Update: {
          attended?: boolean
          created_at?: string
          id?: string
          match_id?: number
          player_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "match_attendance_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_attendance_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "player_stats"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "match_attendance_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      match_partnerships: {
        Row: {
          balls: number
          created_at: string
          id: number
          match_id: number
          player1_id: number
          player2_id: number
          runs: number
          wicket_number: number
        }
        Insert: {
          balls?: number
          created_at?: string
          id?: number
          match_id: number
          player1_id: number
          player2_id: number
          runs?: number
          wicket_number: number
        }
        Update: {
          balls?: number
          created_at?: string
          id?: number
          match_id?: number
          player1_id?: number
          player2_id?: number
          runs?: number
          wicket_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "match_partnerships_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_partnerships_player1_id_fkey"
            columns: ["player1_id"]
            isOneToOne: false
            referencedRelation: "player_stats"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "match_partnerships_player1_id_fkey"
            columns: ["player1_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_partnerships_player2_id_fkey"
            columns: ["player2_id"]
            isOneToOne: false
            referencedRelation: "player_stats"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "match_partnerships_player2_id_fkey"
            columns: ["player2_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      match_templates: {
        Row: {
          created_at: string
          id: string
          name: string
          player_ids: number[]
          team_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          player_ids?: number[]
          team_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          player_ids?: number[]
          team_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_templates_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          created_at: string
          id: number
          match_date: string
          notes: string | null
          opponent_name: string | null
          opponent_score: number | null
          our_score: number | null
          overs: number
          player_of_the_match_id: number | null
          result: string | null
          season_id: number | null
          series_id: number | null
          team_id: string
          tournament_id: number | null
          venue: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          match_date: string
          notes?: string | null
          opponent_name?: string | null
          opponent_score?: number | null
          our_score?: number | null
          overs?: number
          player_of_the_match_id?: number | null
          result?: string | null
          season_id?: number | null
          series_id?: number | null
          team_id: string
          tournament_id?: number | null
          venue?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          match_date?: string
          notes?: string | null
          opponent_name?: string | null
          opponent_score?: number | null
          our_score?: number | null
          overs?: number
          player_of_the_match_id?: number | null
          result?: string | null
          season_id?: number | null
          series_id?: number | null
          team_id?: string
          tournament_id?: number | null
          venue?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_player_of_the_match_id_fkey"
            columns: ["player_of_the_match_id"]
            isOneToOne: false
            referencedRelation: "player_stats"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "matches_player_of_the_match_id_fkey"
            columns: ["player_of_the_match_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "series"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          batting_style: string | null
          bio: string | null
          bowling_style: string | null
          created_at: string
          date_of_birth: string | null
          debut_date: string | null
          id: number
          jersey_number: number | null
          name: string
          nationality: string | null
          photo_url: string | null
          role: string
          team_id: string
        }
        Insert: {
          batting_style?: string | null
          bio?: string | null
          bowling_style?: string | null
          created_at?: string
          date_of_birth?: string | null
          debut_date?: string | null
          id?: number
          jersey_number?: number | null
          name: string
          nationality?: string | null
          photo_url?: string | null
          role?: string
          team_id: string
        }
        Update: {
          batting_style?: string | null
          bio?: string | null
          bowling_style?: string | null
          created_at?: string
          date_of_birth?: string | null
          debut_date?: string | null
          id?: number
          jersey_number?: number | null
          name?: string
          nationality?: string | null
          photo_url?: string | null
          role?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "players_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      point_history: {
        Row: {
          batting_points: number
          bowling_points: number
          created_at: string
          fielding_points: number
          id: number
          player_id: number
          record_date: string
          total_points: number
        }
        Insert: {
          batting_points?: number
          bowling_points?: number
          created_at?: string
          fielding_points?: number
          id?: number
          player_id: number
          record_date?: string
          total_points?: number
        }
        Update: {
          batting_points?: number
          bowling_points?: number
          created_at?: string
          fielding_points?: number
          id?: number
          player_id?: number
          record_date?: string
          total_points?: number
        }
        Relationships: [
          {
            foreignKeyName: "point_history_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "player_stats"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "point_history_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      rank_snapshots: {
        Row: {
          batting_rank: number | null
          bowling_rank: number | null
          created_at: string
          fielding_rank: number | null
          id: number
          overall_rank: number
          player_id: number
          season_id: number | null
          snapshot_date: string
        }
        Insert: {
          batting_rank?: number | null
          bowling_rank?: number | null
          created_at?: string
          fielding_rank?: number | null
          id?: number
          overall_rank: number
          player_id: number
          season_id?: number | null
          snapshot_date?: string
        }
        Update: {
          batting_rank?: number | null
          bowling_rank?: number | null
          created_at?: string
          fielding_rank?: number | null
          id?: number
          overall_rank?: number
          player_id?: number
          season_id?: number | null
          snapshot_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "rank_snapshots_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "player_stats"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "rank_snapshots_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rank_snapshots_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      scoring_settings: {
        Row: {
          batting_fifty_bonus: number
          batting_four_points: number
          batting_hundred_bonus: number
          batting_run_points: number
          batting_six_points: number
          batting_sr_bonus_cap: number
          batting_sr_bonus_divisor: number
          batting_thirty_bonus: number
          batting_weight: number
          bowling_eco_bonus_cap: number
          bowling_eco_bonus_multiplier: number
          bowling_eco_target: number
          bowling_fivefer_bonus: number
          bowling_maiden_points: number
          bowling_noball_penalty: number
          bowling_threefer_bonus: number
          bowling_weight: number
          bowling_wicket_points: number
          bowling_wide_penalty: number
          fielding_catch_points: number
          fielding_dropped_catch_penalty: number
          fielding_runout_points: number
          fielding_stumping_points: number
          fielding_weight: number
          id: number
          team_id: string | null
          updated_at: string
        }
        Insert: {
          batting_fifty_bonus?: number
          batting_four_points?: number
          batting_hundred_bonus?: number
          batting_run_points?: number
          batting_six_points?: number
          batting_sr_bonus_cap?: number
          batting_sr_bonus_divisor?: number
          batting_thirty_bonus?: number
          batting_weight?: number
          bowling_eco_bonus_cap?: number
          bowling_eco_bonus_multiplier?: number
          bowling_eco_target?: number
          bowling_fivefer_bonus?: number
          bowling_maiden_points?: number
          bowling_noball_penalty?: number
          bowling_threefer_bonus?: number
          bowling_weight?: number
          bowling_wicket_points?: number
          bowling_wide_penalty?: number
          fielding_catch_points?: number
          fielding_dropped_catch_penalty?: number
          fielding_runout_points?: number
          fielding_stumping_points?: number
          fielding_weight?: number
          id?: number
          team_id?: string | null
          updated_at?: string
        }
        Update: {
          batting_fifty_bonus?: number
          batting_four_points?: number
          batting_hundred_bonus?: number
          batting_run_points?: number
          batting_six_points?: number
          batting_sr_bonus_cap?: number
          batting_sr_bonus_divisor?: number
          batting_thirty_bonus?: number
          batting_weight?: number
          bowling_eco_bonus_cap?: number
          bowling_eco_bonus_multiplier?: number
          bowling_eco_target?: number
          bowling_fivefer_bonus?: number
          bowling_maiden_points?: number
          bowling_noball_penalty?: number
          bowling_threefer_bonus?: number
          bowling_weight?: number
          bowling_wicket_points?: number
          bowling_wide_penalty?: number
          fielding_catch_points?: number
          fielding_dropped_catch_penalty?: number
          fielding_runout_points?: number
          fielding_stumping_points?: number
          fielding_weight?: number
          id?: number
          team_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scoring_settings_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      season_awards: {
        Row: {
          award_type: string
          created_at: string
          id: string
          player_id: number
          points: number
          season_id: number
          stats: Json
        }
        Insert: {
          award_type: string
          created_at?: string
          id?: string
          player_id: number
          points?: number
          season_id: number
          stats?: Json
        }
        Update: {
          award_type?: string
          created_at?: string
          id?: string
          player_id?: number
          points?: number
          season_id?: number
          stats?: Json
        }
        Relationships: [
          {
            foreignKeyName: "season_awards_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "player_stats"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "season_awards_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "season_awards_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      seasons: {
        Row: {
          created_at: string
          end_date: string | null
          id: number
          is_active: boolean
          name: string
          start_date: string | null
          team_id: string
          year: number
        }
        Insert: {
          created_at?: string
          end_date?: string | null
          id?: number
          is_active?: boolean
          name: string
          start_date?: string | null
          team_id: string
          year: number
        }
        Update: {
          created_at?: string
          end_date?: string | null
          id?: number
          is_active?: boolean
          name?: string
          start_date?: string | null
          team_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "seasons_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      series: {
        Row: {
          created_at: string
          description: string | null
          end_date: string | null
          id: number
          is_active: boolean
          name: string
          season_id: number | null
          start_date: string | null
          team_id: string
          updated_at: string
          venue: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: number
          is_active?: boolean
          name: string
          season_id?: number | null
          start_date?: string | null
          team_id: string
          updated_at?: string
          venue?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: number
          is_active?: boolean
          name?: string
          season_id?: number | null
          start_date?: string | null
          team_id?: string
          updated_at?: string
          venue?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "series_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "series_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          description: string | null
          id: string
          logo_url: string | null
          name: string
          owner_user_id: string | null
          tagline: string | null
          updated_at: string
          watermark_enabled: boolean
          watermark_handle: string | null
          watermark_position: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          name: string
          owner_user_id?: string | null
          tagline?: string | null
          updated_at?: string
          watermark_enabled?: boolean
          watermark_handle?: string | null
          watermark_position?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          owner_user_id?: string | null
          tagline?: string | null
          updated_at?: string
          watermark_enabled?: boolean
          watermark_handle?: string | null
          watermark_position?: string
        }
        Relationships: []
      }
      tournaments: {
        Row: {
          created_at: string
          description: string | null
          end_date: string | null
          id: number
          is_active: boolean
          name: string
          start_date: string | null
          team_id: string | null
          tournament_type: string | null
          venue: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: number
          is_active?: boolean
          name: string
          start_date?: string | null
          team_id?: string | null
          tournament_type?: string | null
          venue?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: number
          is_active?: boolean
          name?: string
          start_date?: string | null
          team_id?: string | null
          tournament_type?: string | null
          venue?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tournaments_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      player_stats: {
        Row: {
          bowling_balls: number | null
          catches: number | null
          dot_balls: number | null
          dropped_catches: number | null
          fifties: number | null
          five_fers: number | null
          fours: number | null
          fours_conceded: number | null
          hundreds: number | null
          maidens: number | null
          matches: number | null
          no_balls: number | null
          player_id: number | null
          runouts: number | null
          runs_conceded: number | null
          sixes: number | null
          sixes_conceded: number | null
          stumpings: number | null
          thirties: number | null
          three_fers: number | null
          times_out: number | null
          total_balls: number | null
          total_runs: number | null
          wickets: number | null
          wides: number | null
        }
        Insert: {
          bowling_balls?: never
          catches?: never
          dot_balls?: never
          dropped_catches?: never
          fifties?: never
          five_fers?: never
          fours?: never
          fours_conceded?: never
          hundreds?: never
          maidens?: never
          matches?: never
          no_balls?: never
          player_id?: number | null
          runouts?: never
          runs_conceded?: never
          sixes?: never
          sixes_conceded?: never
          stumpings?: never
          thirties?: never
          three_fers?: never
          times_out?: never
          total_balls?: never
          total_runs?: never
          wickets?: never
          wides?: never
        }
        Update: {
          bowling_balls?: never
          catches?: never
          dot_balls?: never
          dropped_catches?: never
          fifties?: never
          five_fers?: never
          fours?: never
          fours_conceded?: never
          hundreds?: never
          maidens?: never
          matches?: never
          no_balls?: never
          player_id?: number | null
          runouts?: never
          runs_conceded?: never
          sixes?: never
          sixes_conceded?: never
          stumpings?: never
          thirties?: never
          three_fers?: never
          times_out?: never
          total_balls?: never
          total_runs?: never
          wickets?: never
          wides?: never
        }
        Relationships: []
      }
    }
    Functions: {
      claim_admin_if_none: { Args: never; Returns: boolean }
      create_team_for_user: {
        Args: { p_description?: string; p_team_name: string }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
