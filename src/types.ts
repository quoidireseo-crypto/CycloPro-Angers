export type Category = 'Paysage' | 'Plomberie' | 'Menuiserie' | 'Électricité' | 'Livraison' | 'Bâtiment' | 'Réparation' | 'Solidarité' | 'Logistique';

export interface Review {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
}

export interface Entrepreneur {
  id: string;
  name: string;
  category: Category;
  description: string;
  longDescription?: string;
  siret?: string;
  location: string;
  coordinates: [number, number];
  image?: string;
  co2Saved?: number; // Kg of CO2 saved per year
  reviews?: Review[];
  ownerId?: string;
  stats?: {
    kgTransported?: number;
    yearsActive?: number;
    co2Saved?: string;
  };
  contact: {
    phone?: string;
    email?: string;
    website?: string;
  };
}
