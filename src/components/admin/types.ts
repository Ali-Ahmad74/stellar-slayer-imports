import { PlayerRole } from '@/types/cricket';

export interface AdminPlayer {
  id: number;
  name: string;
  role: string;
  batting_style: string | null;
  bowling_style: string | null;
  photo_url: string | null;
  created_at: string;
}

export interface AdminMatch {
  id: number;
  match_date: string;
  overs: number;
  venue: string | null;
  opponent_name: string | null;
  our_score: number | null;
  opponent_score: number | null;
  result: string | null;
  tournament_id: number | null;
  series_id?: number | null;
  player_of_the_match_id?: number | null;
  notes?: string | null;
  created_at: string;
}

export interface AdminSeason {
  id: number;
  name: string;
  year: number;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
}

export interface AdminTournament {
  id: number;
  name: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  venue: string | null;
  tournament_type: string | null;
  is_active: boolean;
  created_at: string;
}

export interface AdminSeries {
  id: number;
  name: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  venue: string | null;
  is_active: boolean;
  created_at: string;
}
