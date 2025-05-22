import type { FrontendSocialLink } from '@/types/contract.types';

const PINATA_JWT = import.meta.env.VITE_PINATA_JWT;
const PINATA_GATEWAY = import.meta.env.VITE_PINATA_GATEWAY || 'https://gateway.pinata.cloud';

interface PinataResponse {
  IpfsHash: string;
  PinSize: number;
  Timestamp: string;
}

interface SocialLinksData {
  username: string;
  links: FrontendSocialLink[];
  lastUpdated: number;
  version: string;
}

interface PinListResponse {
  count: number;
  rows: Array<{
    id: string;
    ipfs_pin_hash: string;
    size: number;
    user_id: string;
    date_pinned: string;
    date_unpinned: string | null;
    metadata: {
      name: string;
      keyvalues: Record<string, string>;
    };
  }>;
}

class PinataService {
  private baseUrl = 'https://api.pinata.cloud';
  private cache = new Map<string, { data: FrontendSocialLink[]; timestamp: number }>();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  private getHeaders() {
    return {
      'Authorization': `Bearer ${PINATA_JWT}`,
      'Content-Type': 'application/json',
    };
  }

  async pinSocialLinks(username: string, links: FrontendSocialLink[]): Promise<string | null> {
    try {
      const data: SocialLinksData = {
        username,
        links,
        lastUpdated: Date.now(),
        version: '1.0'
      };

      const response = await fetch(`${this.baseUrl}/pinning/pinJSONToIPFS`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          pinataContent: data,
          pinataMetadata: {
            name: `montip-social-${username}-${Date.now()}`,
            keyvalues: {
              username: username.toLowerCase(),
              type: 'social-links',
              version: '1.0',
              app: 'montip'
            }
          },
          pinataOptions: {
            cidVersion: 1
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Pinata API error: ${response.statusText} - ${errorText}`);
      }

      const result: PinataResponse = await response.json();
      this.cache.set(username.toLowerCase(), { data: links, timestamp: Date.now() });
      return result.IpfsHash;
    } catch (error) {
      console.error('Error pinning to IPFS:', error);
      return null;
    }
  }

  async getSocialLinks(ipfsHash: string): Promise<SocialLinksData | null> {
    try {
      const response = await fetch(`${PINATA_GATEWAY}/ipfs/${ipfsHash}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch from IPFS: ${response.statusText}`);
      }

      const data: SocialLinksData = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching from IPFS:', error);
      return null;
    }
  }

  async getSocialLinksForUser(username: string): Promise<FrontendSocialLink[]> {
    const normalizedUsername = username.toLowerCase();
    
    try {
      const cached = this.cache.get(normalizedUsername);
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }

      const searchUrl = `${this.baseUrl}/data/pinList?status=pinned&metadata[keyvalues]={"username":{"value":"${normalizedUsername}","op":"eq"},"type":{"value":"social-links","op":"eq"},"app":{"value":"montip","op":"eq"}}&sortBy=date_pinned&sortOrder=desc&pageLimit=1`;
      
      const response = await fetch(searchUrl, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`Pinata API error: ${response.statusText}`);
      }

      const result: PinListResponse = await response.json();
      
      if (result.rows && result.rows.length > 0) {
        const ipfsHash = result.rows[0].ipfs_pin_hash;
        const socialData = await this.getSocialLinks(ipfsHash);
        
        if (socialData && socialData.links) {
          this.cache.set(normalizedUsername, { 
            data: socialData.links, 
            timestamp: Date.now() 
          });
          return socialData.links;
        }
      }

      return [];
    } catch (error) {
      console.error('Error getting social links for user:', error);
      return [];
    }
  }

  async updateSocialLinksForUser(username: string, links: FrontendSocialLink[]): Promise<boolean> {
    try {
      const oldPins = await this.getOldPinsForUser(username);
      const newHash = await this.pinSocialLinks(username, links);
      
      if (!newHash) {
        throw new Error('Failed to pin to IPFS');
      }

      // Clean up old pins
      for (const oldPin of oldPins) {
        await this.unpinSocialLinks(oldPin.ipfs_pin_hash);
      }

      return true;
    } catch (error) {
      console.error('Error updating social links:', error);
      return false;
    }
  }

  private async getOldPinsForUser(username: string): Promise<Array<{ ipfs_pin_hash: string }>> {
    try {
      const normalizedUsername = username.toLowerCase();
      const searchUrl = `${this.baseUrl}/data/pinList?status=pinned&metadata[keyvalues]={"username":{"value":"${normalizedUsername}","op":"eq"},"type":{"value":"social-links","op":"eq"},"app":{"value":"montip","op":"eq"}}&sortBy=date_pinned&sortOrder=desc`;
      
      const response = await fetch(searchUrl, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        return [];
      }

      const result: PinListResponse = await response.json();
      return result.rows || [];
    } catch (error) {
      console.error('Error getting old pins:', error);
      return [];
    }
  }

  async unpinSocialLinks(ipfsHash: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/pinning/unpin/${ipfsHash}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      });

      return response.ok;
    } catch (error) {
      console.error('Error unpinning from IPFS:', error);
      return false;
    }
  }

  clearCache(username: string) {
    this.cache.delete(username.toLowerCase());
  }

  isConfigured(): boolean {
    return !!PINATA_JWT;
  }
}

export const pinataService = new PinataService();