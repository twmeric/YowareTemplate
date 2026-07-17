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

export function useContent(slug?: string) {
  const [content, setContent] = useState<SiteContent>(DEFAULT_CONTENT);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        // Future multi-template support: try slug-specific content first
        const paths = slug ? [`/data/content-${slug}.json`, '/data/content.json'] : ['/data/content.json'];
        let lastErr: Error | null = null;
        for (const path of paths) {
          try {
            const response = await fetch(path);
            if (!response.ok) {
              if (response.status === 404) continue;
              throw new Error(`Failed to load content: ${response.status}`);
            }
            const data = (await response.json()) as SiteContent;
            setContent(data);
            setError(null);
            return;
          } catch (err) {
            lastErr = err instanceof Error ? err : new Error('Unknown error');
          }
        }
        throw lastErr || new Error('Failed to load content');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [slug]);

  return { content, loading, error };
}

export default useContent;
