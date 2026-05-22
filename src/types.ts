export interface Post {
  id: number;
  title: string;
  content: string;
  image_url: string | null;
  views: number;
  created_at: string;
}

export interface Location {
  id: number;
  name: string;
  longitude: number;
  latitude: number;
  description: string;
  date: string;
  type: string;
}

export interface Attribute {
  id: number;
  title: string;
  description: string;
  icon: string;
}

export interface Settings {
  name: string;
  title: string;
  description: string;
  avatar_url: string;
  github_url: string;
  twitter_url: string;
  email: string;
  footer_text: string;
  footer_subtitle: string;
  footer_copyright: string;
  map_title: string;
  map_subtitle: string;
  map_unit: string;
  stat_1_label: string;
  stat_1_value: string;
  stat_2_label: string;
  stat_2_value: string;
  stat_3_label: string;
  stat_3_value: string;
  blog_title: string;
  favicon_url: string;
  bg_image_url: string;
  bg_blur: string;
}
