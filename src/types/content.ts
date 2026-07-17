/**
 * Site content schema.
 * All customer-facing copy, images, contact info and product data live here.
 * The React UI is only the shell; this file describes the shape of the data
 * that drives every section.
 */

export interface NavItem {
  label: string;
  target: string;
}

export interface Button {
  label: string;
  target: string;
}

export interface ServiceItem {
  icon: string;
  title: string;
  desc: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  tag?: string;
}

export interface SocialLink {
  platform: 'facebook' | 'instagram' | 'youtube' | 'twitter' | 'linkedin' | string;
  url: string;
}

export interface SiteContent {
  /** Site-wide brand identity */
  brand: {
    name: string;
    /** Single-letter logo mark, e.g. "M". Used when logoImage is empty. */
    logo: string;
    /** Optional full logo image URL. When provided, overrides the letter mark. */
    logoImage?: string;
    /** Short English / alternate tagline */
    tagline: string;
  };

  /** Top navigation */
  nav: {
    items: NavItem[];
  };

  /** Hero section */
  hero: {
    badge: string;
    titleLines: string[];
    /** Which title line(s) should use the accent color */
    highlightedLines: number[];
    description: string;
    primaryButton: Button;
    secondaryButton: Button;
    image: string;
  };

  /** Founder / brand story section */
  story: {
    title: string;
    paragraphs: string[];
    features: string[];
    image: string;
    quote: string;
  };

  /** Services / core business section */
  services: {
    title: string;
    subtitle: string;
    items: ServiceItem[];
  };

  /** Product showcase section */
  products: {
    title: string;
    subtitle: string;
    viewAllText: string;
    items: Product[];
  };

  /** Contact CTA section */
  contact: {
    title: string;
    description: string;
    whatsapp: {
      /** E.164-ish number without the +, e.g. "85212345678" */
      number: string;
      buttonText: string;
    };
  };

  /** Footer */
  footer: {
    copyright: string;
    socialLinks: SocialLink[];
  };
}

export default SiteContent;
