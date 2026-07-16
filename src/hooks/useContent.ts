import { useState, useEffect } from 'react';
import type { SiteContent } from '../types/content';

const DEFAULT_CONTENT: SiteContent = {
  brand: { name: 'Loading...', logo: '', tagline: '' },
  nav: { items: [] },
  hero: {
    badge: '',
    titleLines: [],
    highlightedLines: [],
    description: '',
    primaryButton: { label: '', target: '' },
    secondaryButton: { label: '', target: '' },
    image: ''
  },
  story: { title: '', paragraphs: [], features: [], image: '', quote: '' },
  services: { title: '', subtitle: '', items: [] },
  products: { title: '', subtitle: '', viewAllText: '', items: [] },
  contact: { title: '', description: '', whatsapp: { number: '', buttonText: '' } },
  footer: { copyright: '', socialLinks: [] }
};

export function useContent() {
  const [content, setContent] = useState<SiteContent>(DEFAULT_CONTENT);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch('/data/content.json');
        if (!response.ok) {
          throw new Error(`Failed to load content: ${response.status}`);
        }
        const data = (await response.json()) as SiteContent;
        setContent(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return { content, loading, error };
}

export default useContent;
