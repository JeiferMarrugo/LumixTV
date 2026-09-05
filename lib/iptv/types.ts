export interface IptvChannel {
  id: string;
  name: string;
  alt_names?: string[];
  country: string;
  categories: string[];
  is_nsfw: boolean;
  closed?: string | null;
  website?: string | null;
}

export interface IptvStream {
  channel: string | null;
  feed?: string | null;
  title: string;
  url: string;
  referrer?: string | null;
  user_agent?: string | null;
  quality?: string | null;
  label?: string | null;
}

export interface IptvLogo {
  channel: string;
  feed?: string | null;
  in_use: boolean;
  format?: string | null;
  url: string;
}

export interface IptvBlockEntry {
  channel: string;
  reason: string;
}

export interface IptvCategory {
  id: string;
  name: string;
}

export interface LiveChannel {
  id: string;
  name: string;
  country: string;
  categories: string[];
  logo?: string;
  quality?: string;
  label?: string;
}

export interface LiveStreamPlayback {
  channelId: string;
  title: string;
  url: string;
  referrer?: string;
  userAgent?: string;
  quality?: string;
  label?: string;
}
