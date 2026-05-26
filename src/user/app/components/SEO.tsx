import { useEffect } from 'react';
import { useLocation } from 'react-router';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  type?: 'website' | 'article' | 'restaurant';
}

export function SEO({ 
  title = "itFood — Scan, Order & Enjoy | Restaurant Ordering India", 
  description = "Discover restaurants, pre-order meals, book dine-in slots and manage takeaway with itFood. The smartest way to order food in India.", 
  image = "https://www.itfood.in/qr-template.png",
  type = "website" 
}: SEOProps) {
  const location = useLocation();
  const currentUrl = `https://www.itfood.in${location.pathname}`;

  useEffect(() => {
    // 1. Update Title (under 60 chars recommended)
    document.title = title;

    // Helper to update or create meta tags
    const updateMetaTag = (selector: string, attribute: string, value: string) => {
      let element = document.querySelector(selector);
      if (!element) {
        element = document.createElement('meta');
        const isName = selector.includes('name=');
        const attrName = selector.match(/"([^"]+)"/)?.[1] || '';
        if (isName) {
          element.setAttribute('name', attrName);
        } else {
          element.setAttribute('property', attrName);
        }
        document.head.appendChild(element);
      }
      element.setAttribute(attribute, value);
    };

    // Helper to update canonical link
    const updateCanonical = (url: string) => {
      let link = document.querySelector('link[rel="canonical"]');
      if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', 'canonical');
        document.head.appendChild(link);
      }
      link.setAttribute('href', url);
    };

    // 2. Update Meta Description (max 150-160 chars recommended)
    updateMetaTag('meta[name="description"]', 'content', description);

    // 3. Update Open Graph Tags
    updateMetaTag('meta[property="og:title"]', 'content', title);
    updateMetaTag('meta[property="og:description"]', 'content', description);
    updateMetaTag('meta[property="og:image"]', 'content', image);
    updateMetaTag('meta[property="og:url"]', 'content', currentUrl);
    updateMetaTag('meta[property="og:type"]', 'content', type);

    // 4. Update Twitter Card Tags
    updateMetaTag('meta[name="twitter:card"]', 'content', 'summary_large_image');
    updateMetaTag('meta[name="twitter:title"]', 'content', title);
    updateMetaTag('meta[name="twitter:description"]', 'content', description);
    updateMetaTag('meta[name="twitter:image"]', 'content', image);

    // 5. Update Canonical Tag
    updateCanonical(currentUrl);

  }, [title, description, image, currentUrl, type]);

  return null;
}
