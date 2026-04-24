import { Entrepreneur } from './types';

export const entrepreneurs: Entrepreneur[] = [
  {
    id: 'sicle',
    name: 'Sicle',
    category: 'Paysage',
    siret: '820 123 456 00012',
    description: 'Paysagistes engagés dans la transition écologique. Nous transportons jusqu\'à 200kg d\'outils et de matériaux (arbustes, broyeurs) via nos remorques électriques.',
    longDescription: 'Sicle est un collectif de paysagistes qui a fait le choix radical du vélo pour l\'ensemble de ses opérations. Fondée à Angers, l\'entreprise prouve chaque jour qu\'il est possible de réaliser des chantiers d\'envergure sans utiliser de véhicule thermique. Nos remorques électriques sur mesure nous permettent de déplacer des charges lourdes tout en préservant le calme et la qualité de l\'air de nos quartiers.',
    location: 'Place Giffard-Langevin, Angers',
    coordinates: [47.4645, -0.5518],
    image: 'https://images.unsplash.com/photo-1558449028-b53a39d100fc?q=80&w=800&auto=format&fit=crop',
    co2Saved: 850,
    stats: {
      kgTransported: 200,
      yearsActive: 10,
      co2Saved: 'Haute'
    },
    contact: {
      website: 'https://sicle.fr',
      email: 'contact@sicle.fr'
    },
    reviews: [
      { id: '1', userName: 'Marie D.', rating: 5, comment: 'Équipe très professionnelle et super concept !', date: '2024-03-15' },
      { id: '2', userName: 'Jean P.', rating: 4, comment: 'Très satisfait du travail paysager.', date: '2024-02-10' }
    ]
  },
  {
    id: 'alexis-plomberie',
    name: 'Alexis Plomberie',
    category: 'Plomberie',
    siret: '910 987 654 00021',
    description: 'Artisan plombier circulant exclusivement à vélo cargo. Capable de transporter des chauffe-eaux de 200L.',
    longDescription: 'Alexis est le pionnier de la plomberie à vélo à Angers. Son vélo cargo est devenu un élément familier du paysage urbain. Spécialisé dans le dépannage rapide et l\'installation de chauffe-eaux, il intervient là où les camionnettes s\'embourbent dans le trafic.',
    location: 'Quartier de la Doutre, Angers',
    coordinates: [47.4760, -0.5630],
    image: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?q=80&w=800&auto=format&fit=crop',
    co2Saved: 420,
    contact: {
      phone: '06 12 34 56 78',
      email: 'alexis.plombier@example.com'
    },
    reviews: [
      { id: '3', userName: 'Sophie L.', rating: 5, comment: 'Arrivé très rapidement malgré les bouchons en ville. Le vélo change tout !', date: '2024-04-01' }
    ]
  },
  {
    id: 'les-rayonneurs',
    name: 'Les Rayonneurs',
    category: 'Logistique',
    siret: '880 111 222 00099',
    description: 'Expert en cyclo-logistique urbaine co-fondé par Simon Bondu. Livraison du dernier kilomètre capable de transporter jusqu\'à 450 kg et 1,2 m³ par trajet. Plus de 20 000 km parcourus en 8 ans.',
    location: 'Centre-ville et hypercentre, Angers',
    coordinates: [47.4710, -0.5520],
    image: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5997?q=80&w=800&auto=format&fit=crop',
    co2Saved: 1250,
    stats: {
      kgTransported: 450,
      yearsActive: 8,
      co2Saved: 'Extrême'
    },
    contact: {
      website: 'https://lesrayonneurs.fr',
      email: 'contact@lesrayonneurs.fr'
    }
  },
  {
    id: 'atelier-cobi',
    name: 'Atelier Cobi',
    category: 'Réparation',
    siret: '920 333 444 00077',
    description: 'Réparation de vélos et trottinettes à domicile ou en entreprise par les frères Kévin et Luigi Moreau (Lauréats Initiatives Économie Circulaire 2025). Intervention dans un rayon de 5km.',
    location: 'Atelier Rue Pocquet-de-Livonnières + Mobile',
    coordinates: [47.4735, -0.5480],
    co2Saved: 310,
    contact: {
      website: 'https://cobi-angers.fr',
      phone: '07 12 89 45 67'
    }
  },
  {
    id: 'mamie-cyclette',
    name: 'Mamie Cyclette',
    category: 'Solidarité',
    siret: '940 555 666 00088',
    description: 'Structure mi-entreprise mi-association créée par Rachid Amoura et Jean-Baptiste Moriceau. Propose des balades en vélo-cargo adapté pour offrir un bol d\'air pur aux seniors en Ehpad.',
    location: 'Ehpad de l\'agglomération angevine',
    coordinates: [47.4800, -0.5400],
    contact: {
      website: 'https://mamiecyclette.fr',
      email: 'bonjour@mamiecyclette.fr'
    }
  },
  {
    id: 'leonard-menuiserie',
    name: 'Léonard Menuisier',
    category: 'Menuiserie',
    siret: '850 444 333 00055',
    description: 'Menuiserie artisanale. Livraison de bois et transport de ponceuses, tréteaux et aspirateurs à vélo.',
    longDescription: 'Léonard a conçu une remorque spécifique pour le transport de tasseaux et de panneaux de bois jusqu\'à 3 mètres de long. Son approche artisanale alliée à la mobilité douce lui permet d\'intervenir en centre-ville sans contrainte logistique.',
    location: 'Angers Centre',
    coordinates: [47.4700, -0.5550],
    image: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?q=80&w=800&auto=format&fit=crop',
    contact: {
      email: 'leonard@bois-velo.fr',
      phone: '06 98 76 54 32'
    }
  },
  {
    id: 'benoit-vincent-elec',
    name: 'Benoît & Vincent Électricité',
    category: 'Électricité',
    description: 'Électriciens à vélo. Fini les problèmes de stationnement pour vos travaux électriques. Transport de câbles et radiateurs.',
    location: 'Angers et agglomération',
    coordinates: [47.4600, -0.5600],
    stats: {
      yearsActive: 6
    },
    contact: {
      phone: '02 XX XX XX XX'
    }
  },
  {
    id: 'le-xylocope',
    name: 'Le Xylocope Écohabitat',
    category: 'Menuiserie',
    siret: '890 222 333 00044',
    description: 'Menuisier Charpentier Urbain. Spécialiste de l\'aménagement bois et de l\'éco-construction circulant en vélo-cargo lourd.',
    longDescription: 'Le Xylocope est une entreprise de menuiserie qui intervient au cœur d\'Angers pour des projets d\'aménagement intérieur et de charpente légère. En utilisant des vélos-cargos Douze Cycles, l\'équipe transporte ses outils et ses matériaux sans aucune émission sonore ni pollution atmosphérique.',
    location: 'Angers et proximité',
    coordinates: [47.4720, -0.5500],
    image: 'https://images.unsplash.com/photo-1590674154471-1678ee20a1ad?q=80&w=800&auto=format&fit=crop',
    co2Saved: 680,
    contact: {
      email: 'contact@lexylocope.fr',
      website: 'http://lexylocope.fr'
    }
  },
  {
    id: 'velectricite',
    name: 'Velectricité',
    category: 'Électricité',
    siret: '930 111 222 00033',
    description: 'Artisan électricien local à vélo. Installation, dépannage et maintenance électrique décarbonée.',
    location: 'Quartier Saint-Laud, Angers',
    coordinates: [47.4650, -0.5580],
    image: 'https://images.unsplash.com/photo-1621905252507-b35220adcfba?q=80&w=800&auto=format&fit=crop',
    co2Saved: 390,
    contact: {
      phone: '06 70 68 39 07'
    }
  },
  {
    id: 'plomberie-bicyclette',
    name: 'La Plomberie à Bicyclette',
    category: 'Plomberie',
    siret: '940 333 444 00022',
    description: 'Services de plomberie et chauffage avec intervention 100% cyclo-mobile dans l\'agglomération angevine.',
    location: 'Angers Hypercentre',
    coordinates: [47.4705, -0.5530],
    image: 'https://images.unsplash.com/photo-1504148455328-497c5efdf13a?q=80&w=800&auto=format&fit=crop',
    co2Saved: 510,
    contact: {
      phone: '06 10 32 65 27'
    }
  },
  {
    id: 'doutre-collectif',
    name: 'Collectif de la Doutre',
    category: 'Bâtiment',
    description: 'Un quatuor d\'artisans du bâtiment qui sillonne le quartier à vélo cargo. La proximité au service du patrimoine.',
    location: 'La Doutre, Angers',
    coordinates: [47.4770, -0.5650],
    contact: {
      website: '#'
    }
  }
];
