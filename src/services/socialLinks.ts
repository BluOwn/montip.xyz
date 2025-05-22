// Frontend social link management (localStorage based)
import type { FrontendSocialLink } from '@/types/contract.types';

const SOCIAL_LINKS_KEY = 'montip_social_links';

export const getSocialLinksForUser = (username: string): FrontendSocialLink[] => {
  try {
    const stored = localStorage.getItem(SOCIAL_LINKS_KEY);
    if (!stored) return [];
    
    const allLinks: FrontendSocialLink[] = JSON.parse(stored);
    return allLinks.filter(link => link.username === username);
  } catch (error) {
    console.error('Error getting social links:', error);
    return [];
  }
};

export const addSocialLinkForUser = (
  username: string, 
  platform: FrontendSocialLink['platform'], 
  value: string
): boolean => {
  try {
    const stored = localStorage.getItem(SOCIAL_LINKS_KEY);
    const allLinks: FrontendSocialLink[] = stored ? JSON.parse(stored) : [];
    
    // Remove existing link for this platform and user
    const filteredLinks = allLinks.filter(
      link => !(link.username === username && link.platform === platform)
    );
    
    // Add new link
    const newLink: FrontendSocialLink = {
      id: `${username}_${platform}_${Date.now()}`,
      username,
      platform,
      value,
      createdAt: Date.now(),
    };
    
    filteredLinks.push(newLink);
    localStorage.setItem(SOCIAL_LINKS_KEY, JSON.stringify(filteredLinks));
    return true;
  } catch (error) {
    console.error('Error adding social link:', error);
    return false;
  }
};

export const removeSocialLinkForUser = (
  username: string, 
  platform: FrontendSocialLink['platform']
): boolean => {
  try {
    const stored = localStorage.getItem(SOCIAL_LINKS_KEY);
    if (!stored) return true;
    
    const allLinks: FrontendSocialLink[] = JSON.parse(stored);
    const filteredLinks = allLinks.filter(
      link => !(link.username === username && link.platform === platform)
    );
    
    localStorage.setItem(SOCIAL_LINKS_KEY, JSON.stringify(filteredLinks));
    return true;
  } catch (error) {
    console.error('Error removing social link:', error);
    return false;
  }
};

export const formatSocialLink = (link: FrontendSocialLink) => {
  switch (link.platform) {
    case 'twitter': {
      const handle = link.value.replace('@', '');
      return {
        url: `https://twitter.com/${handle}`,
        label: `@${handle}`,
        displayName: 'Twitter',
      };
    }

    case 'website': {
      const url = link.value.startsWith('http') ? link.value : `https://${link.value}`;
      return {
        url,
        label: link.value.replace(/^https?:\/\//, ''),
        displayName: 'Website',
      };
    }

    case 'instagram': {
      const instaHandle = link.value.replace('@', '');
      return {
        url: `https://instagram.com/${instaHandle}`,
        label: `@${instaHandle}`,
        displayName: 'Instagram',
      };
    }

    case 'youtube': {
      const url = link.value.startsWith('http') ? link.value : `https://youtube.com/${link.value}`;
      return {
        url,
        label: link.value,
        displayName: 'YouTube',
      };
    }

    case 'github': {
      const githubHandle = link.value.replace('@', '');
      return {
        url: `https://github.com/${githubHandle}`,
        label: githubHandle,
        displayName: 'GitHub',
      };
    }

    case 'linkedin': {
      const url = link.value.startsWith('http') ? link.value : `https://linkedin.com/in/${link.value}`;
      return {
        url,
        label: link.value,
        displayName: 'LinkedIn',
      };
    }

    default:
      return {
        url: link.value,
        label: link.value,
        displayName: link.platform,
      };
  }
};
