import { pinataService } from './pinataService';
import type { FrontendSocialLink } from '@/types/contract.types';
import toast from 'react-hot-toast';

interface SocialLinksManager {
  getSocialLinksForUser: (username: string) => Promise<FrontendSocialLink[]>;
  addSocialLinkForUser: (username: string, platform: FrontendSocialLink['platform'], value: string) => Promise<boolean>;
  removeSocialLinkForUser: (username: string, platform: FrontendSocialLink['platform']) => Promise<boolean>;
}

class HybridSocialLinksManager implements SocialLinksManager {
  async getSocialLinksForUser(username: string): Promise<FrontendSocialLink[]> {
    try {
      if (pinataService.isConfigured()) {
        const ipfsLinks = await pinataService.getSocialLinksForUser(username);
        if (ipfsLinks.length > 0) {
          return ipfsLinks;
        }
      }
      return this.getLocalStorageLinks(username);
    } catch (error) {
      console.error('Error getting social links:', error);
      return this.getLocalStorageLinks(username);
    }
  }

  async addSocialLinkForUser(
    username: string, 
    platform: FrontendSocialLink['platform'], 
    value: string
  ): Promise<boolean> {
    try {
      const currentLinks = await this.getSocialLinksForUser(username);
      const filteredLinks = currentLinks.filter(link => link.platform !== platform);
      
      const newLink: FrontendSocialLink = {
        id: `${username}_${platform}_${Date.now()}`,
        username,
        platform,
        value,
        createdAt: Date.now(),
      };
      
      const updatedLinks = [...filteredLinks, newLink];
      let success = false;
      
      if (pinataService.isConfigured()) {
        success = await pinataService.updateSocialLinksForUser(username, updatedLinks);
        if (success) {
          toast.success('Social link saved to IPFS successfully!');
        }
      }
      
      this.setLocalStorageLinks(username, updatedLinks);
      
      if (!success && pinataService.isConfigured()) {
        toast.error('Failed to save to IPFS, saved locally only');
      } else if (!pinataService.isConfigured()) {
        toast.success('Social link saved locally (IPFS not configured)');
      }
      
      return true;
    } catch (error) {
      console.error('Error adding social link:', error);
      toast.error('Failed to add social link');
      return false;
    }
  }

async removeSocialLinkForUser(
  username: string, 
  platform: FrontendSocialLink['platform']
): Promise<boolean> {
  try {
    const currentLinks = await this.getSocialLinksForUser(username);
    const filteredLinks = currentLinks.filter(link => link.platform !== platform);
    
    // Remove the unused 'success' variable:
    if (pinataService.isConfigured()) {
      await pinataService.updateSocialLinksForUser(username, filteredLinks);
    }
    
    // Always save to localStorage as backup
    this.setLocalStorageLinks(username, filteredLinks);
    
    return true;
  } catch (error) {
    console.error('Error removing social link:', error);
    return false;
  }
}

  private getLocalStorageLinks(username: string): FrontendSocialLink[] {
    try {
      const stored = localStorage.getItem(`montip_social_links_${username.toLowerCase()}`);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return [];
    }
  }

  private setLocalStorageLinks(username: string, links: FrontendSocialLink[]): void {
    try {
      localStorage.setItem(
        `montip_social_links_${username.toLowerCase()}`, 
        JSON.stringify(links)
      );
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  }
}

export const socialLinksService = new HybridSocialLinksManager();