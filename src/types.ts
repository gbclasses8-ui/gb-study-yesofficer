export interface Batch {
  id: number | string;
  title: string;
  thumbnail: string;
}

export interface FolderItem {
  id: string;
  parent_id: string;
  Title: string;
  description?: string;
  material_type: string;
  thumbnail?: string;
  course_id: string;
  live_status?: number;
  event_date?: string;
  date_and_time?: string;
  duration?: string;
  duration_in_secs?: string;
  videos_count?: string | number;
  files_count?: string | number;
  tests_count?: string | number;
  file_link?: string;
  pdf_link?: string;
  pdf_link2?: string;
  download_link?: string;
}

export interface VideoQuality {
  quality: string;
  url: string;
  player_url?: string;
}

export interface VideoDetails {
  success: boolean;
  video_id: string;
  course_id: string;
  title: string;
  duration: string;
  thumbnail: string;
  date: string;
  video_player_token?: string;
  decoded_video_link?: string;
  player_url?: string;
  qualities?: VideoQuality[];
  decoded_pdf_link?: string;
  pdf_viewer?: string;
  decoded_pdf_link2?: string;
  pdf_viewer2?: string;
}
