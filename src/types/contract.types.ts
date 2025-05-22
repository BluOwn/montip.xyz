export interface Jar {
  owner: string;
  username: string;
  description: string;
  totalReceived: number;
  exists: boolean;
}

export interface Tip {
  sender: string;
  amount: number;
  message: string;
  timestamp: number;
}

export interface SocialLink {
  key: string;
  value: string;
}

export interface ContractError {
  code: number;
  message: string;
}

// Frontend-only social link storage
export interface FrontendSocialLink {
  id: string;
  username: string;
  platform: 'twitter' | 'website' | 'instagram' | 'youtube' | 'github' | 'linkedin';
  value: string;
  createdAt: number;
}