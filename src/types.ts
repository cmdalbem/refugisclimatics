export interface Shelter {
  name?: string;
  address?: string;
  district?: string;
  neighborhood?: string;
  lat?: number;
  lon?: number;
  typology?: string;
  characteristics?: string[];
  opening_hours_raw?: [string?, string?, string?][];
  timetable_raw?: string;
  notice?: string;
  contact_type?: string;
  contact_value?: string;
  image_url?: string;
  detail_url?: string;
  register_id?: string;
  match_status?: string;
}

export type LocationStatus = 'loading' | 'active' | 'error';
