export interface Restaurant {
  id: string;
  name: string;
  image_url: string;
  url: string;
  review_count: number;
  rating: number;
  price?: string;
  location: {
    address1: string;
    address2?: string;
    address3?: string;
    city: string;
    zip_code: string;
    country: string;
    state: string;
    display_address: string[];
  };
  categories: {
    alias: string;
    title: string;
  }[];
  coordinates: {
    latitude: number;
    longitude: number;
  };
  phone: string;
  display_phone: string;
}

export interface YelpResponse {
  businesses: Restaurant[];
  total: number;
  region: {
    center: {
      longitude: number;
      latitude: number;
    };
  };
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface QueryParams {
  food: string;
  location: string;
  price?: string;
  open_now?: boolean;
  radius?: number;
}