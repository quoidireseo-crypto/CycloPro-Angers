/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  Bike, 
  MapPin, 
  Phone, 
  Mail, 
  ExternalLink, 
  Leaf, 
  Zap, 
  Hammer, 
  Package, 
  Droplets,
  Construction,
  Filter,
  X,
  Star,
  MessageSquare,
  Plus,
  Send,
  Wrench,
  Heart,
  Boxes,
  TrendingDown,
  Users,
  Trophy,
  Facebook,
  Twitter,
  Linkedin,
  Share2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { entrepreneurs } from './data';
import { Category, Entrepreneur, Review } from './types';

// Fix for Leaflet default icon issues in React
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const CATEGORY_ICONS: Record<Category, React.ReactNode> = {
  'Paysage': <Leaf className="w-4 h-4" />,
  'Plomberie': <Droplets className="w-4 h-4" />,
  'Menuiserie': <Hammer className="w-4 h-4" />,
  'Électricité': <Zap className="w-4 h-4" />,
  'Livraison': <Package className="w-4 h-4" />,
  'Bâtiment': <Construction className="w-4 h-4" />,
  'Réparation': <Wrench className="w-4 h-4" />,
  'Solidarité': <Heart className="w-4 h-4" />,
  'Logistique': <Boxes className="w-4 h-4" />
};

function StarRating({ rating, size = 12 }: { rating: number, size?: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star 
          key={i} 
          size={size} 
          className={`${i <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200 fill-gray-200'}`} 
        />
      ))}
    </div>
  );
}

export default function App() {
  const [data, setData] = useState<Entrepreneur[]>(entrepreneurs);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'Tous'>('Tous');
  const [activeReviewProId, setActiveReviewProId] = useState<string | null>(null);
  const [selectedPro, setSelectedPro] = useState<Entrepreneur | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [newReview, setNewReview] = useState({ userName: '', rating: 5, comment: '' });
  const [registrationForm, setRegistrationForm] = useState({
    name: '',
    category: 'Paysage' as Category,
    siret: '',
    description: '',
    longDescription: '',
    location: '',
    email: '',
    phone: '',
    website: '',
    image: '',
    coordinates: [47.4710, -0.5520] as [number, number]
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('angers_artisans_favs');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('angers_artisans_favs', JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  const shareOnSocial = (platform: 'facebook' | 'twitter' | 'linkedin', pro: Entrepreneur) => {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(`Découvrez ${pro.name}, un artisan à vélo à Angers ! 🚲✨`);
    
    const shareUrls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      twitter: `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`
    };
    
    window.open(shareUrls[platform], '_blank', 'noreferrer');
  };

  const filteredEntrepreneurs = useMemo(() => {
    let result = data.filter(pro => {
      const searchTerms = searchQuery.toLowerCase();
      const matchesSearch = pro.name.toLowerCase().includes(searchTerms) || 
                           pro.description.toLowerCase().includes(searchTerms) ||
                           pro.category.toLowerCase().includes(searchTerms) ||
                           pro.location.toLowerCase().includes(searchTerms);
      const matchesCategory = selectedCategory === 'Tous' || pro.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });

    if (showFavoritesOnly) {
      result = result.filter(pro => favorites.includes(pro.id));
    }

    return result;
  }, [searchQuery, selectedCategory, data, favorites, showFavoritesOnly]);

  const categories: (Category | 'Tous')[] = ['Tous', 'Paysage', 'Plomberie', 'Menuiserie', 'Électricité', 'Livraison', 'Bâtiment', 'Réparation', 'Solidarité', 'Logistique'];

  const handleAddReview = (proId: string) => {
    if (!newReview.userName || !newReview.comment) return;

    const review: Review = {
      id: Date.now().toString(),
      userName: newReview.userName,
      rating: newReview.rating,
      comment: newReview.comment,
      date: new Date().toISOString().split('T')[0]
    };

    setData(prev => prev.map(pro => {
      if (pro.id === proId) {
        return {
          ...pro,
          reviews: [review, ...(pro.reviews || [])]
        };
      }
      return pro;
    }));

    setNewReview({ userName: '', rating: 5, comment: '' });
    setActiveReviewProId(null);
  };

  return (
    <div className="min-h-screen bg-[#F5F5F0] text-[#141414] font-sans overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#F5F5F0]/80 backdrop-blur-md border-b border-[#141414]/10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 w-full">
            <div className="flex items-center justify-between w-full md:w-auto shrink-0">
              <div className="flex items-center gap-3">
                <div className="bg-[#5A5A40] p-2 rounded-xl">
                  <Bike className="w-6 h-6 text-[#F5F5F0]" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold tracking-tight">VéloPro Angers</h1>
                  <p className="text-[10px] text-[#5A5A40] font-bold uppercase tracking-wider">Artisans à vélo</p>
                </div>
              </div>
              <button 
                onClick={() => setIsRegistering(true)}
                className="md:hidden px-3 py-1.5 bg-[#141414] text-white rounded-full text-[9px] font-bold uppercase tracking-widest hover:bg-[#5A5A40] transition-colors whitespace-nowrap"
              >
                Inscrire
              </button>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              {/* Search on desktop */}
              <div className="relative flex-1 max-w-md hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#141414]/40" />
                <input 
                  type="text"
                  placeholder="Artisan, service..."
                  className="w-full pl-10 pr-4 py-2 bg-white border border-[#141414]/10 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20 transition-all shadow-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
                <button 
                  onClick={() => setIsRegistering(true)}
                  className="hidden md:block px-4 py-2 bg-[#141414] text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-[#5A5A40] transition-colors whitespace-nowrap"
                >
                  Devenir partenaire
                </button>

                <div className="flex items-center gap-1.5 md:gap-2">
                  <div className="flex bg-white border border-[#141414]/10 rounded-full p-0.5 md:p-1 shadow-sm">
                    <button 
                      onClick={() => setViewMode('grid')}
                      className={`px-3 md:px-4 py-1.5 rounded-full text-[9px] md:text-[10px] font-bold uppercase tracking-widest transition-all ${
                        viewMode === 'grid' ? 'bg-[#5A5A40] text-white' : 'text-[#141414]/40 hover:text-[#141414]'
                      }`}
                    >
                      Liste
                    </button>
                    <button 
                      onClick={() => setViewMode('map')}
                      className={`px-3 md:px-4 py-1.5 rounded-full text-[9px] md:text-[10px] font-bold uppercase tracking-widest transition-all ${
                        viewMode === 'map' ? 'bg-[#5A5A40] text-white' : 'text-[#141414]/40 hover:text-[#141414]'
                      }`}
                    >
                      Carte
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Modal for detailed profile */}
        <AnimatePresence>
          {selectedPro && (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-6">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedPro(null)}
                className="absolute inset-0 bg-[#141414]/80 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-2xl bg-[#F5F5F0] rounded-[2.5rem] overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto"
              >
                <div className="p-8 md:p-12">
                  <header className="flex justify-between items-start mb-8">
                    <div className="flex gap-6 items-start">
                      {selectedPro.image && (
                        <div className="w-24 h-24 md:w-32 md:h-32 rounded-3xl overflow-hidden shrink-0 border-4 border-white shadow-xl">
                          <img 
                            src={selectedPro.image} 
                            alt={selectedPro.name} 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      )}
                      <div>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#5A5A40] text-white rounded-full text-[11px] font-bold uppercase tracking-wider mb-3">
                          {CATEGORY_ICONS[selectedPro.category]}
                          {selectedPro.category}
                        </span>
                        <h2 className="text-3xl md:text-4xl font-serif italic">{selectedPro.name}</h2>
                      </div>
                    </div>
                    <button 
                      onClick={() => setSelectedPro(null)}
                      className="p-2 hover:bg-[#141414]/5 rounded-full transition-colors"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </header>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                    <div className="md:col-span-2 space-y-6">
                      <div className="space-y-4">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-[#141414]/40">À propos</h4>
                        <p className="text-[#141414]/80 leading-relaxed text-lg">
                          {selectedPro.longDescription || selectedPro.description}
                        </p>
                      </div>

                      {selectedPro.stats && (
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-white p-4 rounded-2xl border border-[#141414]/5">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-[#141414]/40 block mb-1">Actif depuis</span>
                            <span className="text-xl font-bold">{selectedPro.stats.yearsActive} ans</span>
                          </div>
                          <div className="bg-white p-4 rounded-2xl border border-[#141414]/5">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-[#141414]/40 block mb-1">Capacité Max</span>
                            <span className="text-xl font-bold">{selectedPro.stats.kgTransported} kg</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-widest text-[#141414]/40">Contact direct</h4>
                      <div className="space-y-3">
                        {selectedPro.contact.phone && (
                          <a href={`tel:${selectedPro.contact.phone}`} className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-[#141414]/5 hover:border-[#5A5A40] transition-colors group">
                            <div className="p-2 bg-[#5A5A40]/10 text-[#5A5A40] rounded-xl group-hover:bg-[#5A5A40] group-hover:text-white transition-colors">
                              <Phone className="w-4 h-4" />
                            </div>
                            <span className="text-sm font-medium">{selectedPro.contact.phone}</span>
                          </a>
                        )}
                        {selectedPro.contact.email && (
                          <a href={`mailto:${selectedPro.contact.email}`} className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-[#141414]/5 hover:border-[#5A5A40] transition-colors group">
                            <div className="p-2 bg-[#5A5A40]/10 text-[#5A5A40] rounded-xl group-hover:bg-[#5A5A40] group-hover:text-white transition-colors">
                              <Mail className="w-4 h-4" />
                            </div>
                            <span className="text-sm font-medium">{selectedPro.contact.email}</span>
                          </a>
                        )}
                        {selectedPro.contact.website && (
                          <a href={selectedPro.contact.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-[#141414]/5 hover:border-[#5A5A40] transition-colors group">
                            <div className="p-2 bg-[#5A5A40]/10 text-[#5A5A40] rounded-xl group-hover:bg-[#5A5A40] group-hover:text-white transition-colors">
                              <ExternalLink className="w-4 h-4" />
                            </div>
                            <span className="text-sm font-medium">Visiter le site</span>
                          </a>
                        )}
                        <div className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-[#141414]/5">
                          <div className="p-2 bg-[#5A5A40]/10 text-[#5A5A40] rounded-xl">
                            <MapPin className="w-4 h-4" />
                          </div>
                          <span className="text-sm font-medium">{selectedPro.location}</span>
                        </div>
                      </div>
                      
                      {selectedPro.siret && (
                        <div className="pt-4 border-t border-[#141414]/5">
                          <span className="text-[10px] font-mono text-[#141414]/40">SIRET: {selectedPro.siret}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-[#141414] rounded-[1.5rem] p-6 text-white">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#F5F5F0]/40 mb-4">Derniers avis clients</h4>
                    <div className="space-y-4">
                      {selectedPro.reviews?.slice(0, 3).map((rev) => (
                        <div key={rev.id} className="border-b border-white/10 pb-4 last:border-0 last:pb-0">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-bold">{rev.userName}</span>
                            <span className="text-xs opacity-40">{rev.date}</span>
                          </div>
                          <StarRating rating={rev.rating} size={12} />
                          <p className="text-sm text-white/70 mt-2 italic">"{rev.comment}"</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Modal for registration */}
        <AnimatePresence>
          {isRegistering && (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-6">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsRegistering(false)}
                className="absolute inset-0 bg-[#141414]/80 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-2xl bg-[#F5F5F0] rounded-[2.5rem] overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto"
              >
                <div className="p-8 md:p-12">
                  <header className="flex justify-between items-start mb-8">
                    <div>
                      <h2 className="text-3xl md:text-4xl font-serif italic">Rejoindre le Réseau</h2>
                      <p className="text-[#141414]/60 mt-2">Créez votre profil artisan à vélo à Angers.</p>
                    </div>
                    <button 
                      onClick={() => setIsRegistering(false)}
                      className="p-2 hover:bg-[#141414]/5 rounded-full transition-colors"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </header>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-[#141414]/40 mb-2">Nom de l'entreprise *</label>
                        <input 
                          type="text" 
                          placeholder="Ex: Sicle Plomberie"
                          className={`w-full bg-white border ${formErrors.name ? 'border-red-500' : 'border-[#141414]/10'} rounded-xl p-3 text-sm focus:ring-1 focus:ring-[#5A5A40] outline-none transition-colors`}
                          value={registrationForm.name}
                          onChange={(e) => {
                            setRegistrationForm({ ...registrationForm, name: e.target.value });
                            if (formErrors.name) setFormErrors(prev => ({ ...prev, name: '' }));
                          }}
                        />
                        {formErrors.name && <p className="text-[10px] text-red-500 font-bold mt-1 px-1 uppercase tracking-tight">{formErrors.name}</p>}
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-[#141414]/40 mb-2">Catégorie *</label>
                        <select 
                          className={`w-full bg-white border ${formErrors.category ? 'border-red-500' : 'border-[#141414]/10'} rounded-xl p-3 text-sm focus:ring-1 focus:ring-[#5A5A40] outline-none appearance-none transition-colors`}
                          value={registrationForm.category}
                          onChange={(e) => {
                            setRegistrationForm({ ...registrationForm, category: e.target.value as Category });
                            if (formErrors.category) setFormErrors(prev => ({ ...prev, category: '' }));
                          }}
                        >
                          {categories.filter(c => c !== 'Tous').map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                        {formErrors.category && <p className="text-[10px] text-red-500 font-bold mt-1 px-1 uppercase tracking-tight">{formErrors.category}</p>}
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-[#141414]/40 mb-2">Numéro SIRET</label>
                        <input 
                          type="text" 
                          placeholder="14 chiffres"
                          className="w-full bg-white border border-[#141414]/10 rounded-xl p-3 text-sm focus:ring-1 focus:ring-[#5A5A40] outline-none"
                          value={registrationForm.siret}
                          onChange={(e) => setRegistrationForm({ ...registrationForm, siret: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-[#141414]/40 mb-2">Localisation *</label>
                        <input 
                          type="text" 
                          placeholder="Ex: Quartier de la Doutre, Angers"
                          className={`w-full bg-white border ${formErrors.location ? 'border-red-500' : 'border-[#141414]/10'} rounded-xl p-3 text-sm focus:ring-1 focus:ring-[#5A5A40] outline-none transition-colors`}
                          value={registrationForm.location}
                          onChange={(e) => {
                            setRegistrationForm({ ...registrationForm, location: e.target.value });
                            if (formErrors.location) setFormErrors(prev => ({ ...prev, location: '' }));
                          }}
                        />
                        {formErrors.location && <p className="text-[10px] text-red-500 font-bold mt-1 px-1 uppercase tracking-tight">{formErrors.location}</p>}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-[#141414]/40 mb-2">Email de contact</label>
                        <input 
                          type="email" 
                          placeholder="votre@email.com"
                          className="w-full bg-white border border-[#141414]/10 rounded-xl p-3 text-sm focus:ring-1 focus:ring-[#5A5A40] outline-none"
                          value={registrationForm.email}
                          onChange={(e) => setRegistrationForm({ ...registrationForm, email: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-[#141414]/40 mb-2">Téléphone</label>
                        <input 
                          type="text" 
                          placeholder="06 XX XX XX XX"
                          className="w-full bg-white border border-[#141414]/10 rounded-xl p-3 text-sm focus:ring-1 focus:ring-[#5A5A40] outline-none"
                          value={registrationForm.phone}
                          onChange={(e) => setRegistrationForm({ ...registrationForm, phone: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-[#141414]/40 mb-2">Site Web</label>
                        <input 
                          type="url" 
                          placeholder="https://..."
                          className="w-full bg-white border border-[#141414]/10 rounded-xl p-3 text-sm focus:ring-1 focus:ring-[#5A5A40] outline-none"
                          value={registrationForm.website}
                          onChange={(e) => setRegistrationForm({ ...registrationForm, website: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-[#141414]/40 mb-2">Lien de la photo (URL)</label>
                        <input 
                          type="url" 
                          placeholder="https://images.unsplash.com/..."
                          className="w-full bg-white border border-[#141414]/10 rounded-xl p-3 text-sm focus:ring-1 focus:ring-[#5A5A40] outline-none"
                          value={registrationForm.image}
                          onChange={(e) => setRegistrationForm({ ...registrationForm, image: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-6">
                    <label className="block text-xs font-bold uppercase tracking-widest text-[#141414]/40 mb-2">Description courte *</label>
                    <textarea 
                      placeholder="Présentez votre activité en une phrase..."
                      className={`w-full bg-white border ${formErrors.description ? 'border-red-500' : 'border-[#141414]/10'} rounded-xl p-3 text-sm focus:ring-1 focus:ring-[#5A5A40] outline-none h-20 resize-none transition-colors`}
                      value={registrationForm.description}
                      onChange={(e) => {
                        setRegistrationForm({ ...registrationForm, description: e.target.value });
                        if (formErrors.description) setFormErrors(prev => ({ ...prev, description: '' }));
                      }}
                    />
                    {formErrors.description && <p className="text-[10px] text-red-500 font-bold mt-1 px-1 uppercase tracking-tight">{formErrors.description}</p>}
                  </div>

                  <div className="mt-6">
                    <label className="block text-xs font-bold uppercase tracking-widest text-[#141414]/40 mb-2">Description détaillée (Profil complet)</label>
                    <textarea 
                      placeholder="Détaillez vos services, votre équipement vélo, votre histoire..."
                      className="w-full bg-white border border-[#141414]/10 rounded-xl p-3 text-sm focus:ring-1 focus:ring-[#5A5A40] outline-none h-32 resize-none"
                      value={registrationForm.longDescription}
                      onChange={(e) => setRegistrationForm({ ...registrationForm, longDescription: e.target.value })}
                    />
                  </div>

                  <div className="mt-8 flex gap-4">
                    <button 
                      onClick={() => {
                        const errors: Record<string, string> = {};
                        if (!registrationForm.name.trim()) errors.name = "Nom requis";
                        if (!registrationForm.category) errors.category = "Catégorie requise";
                        if (!registrationForm.description.trim()) errors.description = "Description requise";
                        if (!registrationForm.location.trim()) errors.location = "Localisation requise";

                        if (Object.keys(errors).length > 0) {
                          setFormErrors(errors);
                          return;
                        }

                        const newPro: Entrepreneur = {
                          id: Date.now().toString(),
                          name: registrationForm.name,
                          category: registrationForm.category,
                          siret: registrationForm.siret,
                          description: registrationForm.description,
                          longDescription: registrationForm.longDescription,
                          location: registrationForm.location,
                          image: registrationForm.image || undefined,
                          contact: {
                            email: registrationForm.email || undefined,
                            phone: registrationForm.phone || undefined,
                            website: registrationForm.website || undefined
                          },
                          reviews: [],
                          coordinates: registrationForm.coordinates
                        };
                        setData([newPro, ...data]);
                        setIsRegistering(false);
                        setFormErrors({});
                        setRegistrationForm({
                          name: '',
                          category: 'Paysage',
                          siret: '',
                          description: '',
                          longDescription: '',
                          location: '',
                          email: '',
                          phone: '',
                          website: '',
                          image: '',
                          coordinates: [47.4710, -0.5520]
                        });
                      }}
                      className="flex-1 py-4 bg-[#5A5A40] text-white rounded-2xl font-bold uppercase tracking-widest hover:bg-[#4A4A30] transition-colors shadow-lg shadow-[#5A5A40]/20"
                    >
                      Valider mon inscription
                    </button>
                    <button 
                      onClick={() => {
                        setIsRegistering(false);
                        setFormErrors({});
                      }}
                      className="px-8 py-4 bg-white border border-[#141414]/10 rounded-2xl font-bold uppercase tracking-widest hover:bg-red-50 text-red-500 transition-colors"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
        <section className="mb-12">
          <div className="relative h-[500px] md:h-[600px] rounded-[2.5rem] md:rounded-[3.5rem] overflow-hidden group shadow-2xl">
            {/* Hero Background Image */}
            <img 
              src="https://media.ouest-france.fr/v1/pictures/MjAyNDAxYzNkNDI2ZDA3Nzc3MmM2YWJlMWQ2ZTliM2ZlZDE2NWM?width=1260&height=708&focuspoint=50%2C25&cropresize=1&client_id=bpeditorial&sign=dbb5d421e82e0d588a936336644a14f3c636a160d7a28215ea880314c7de4df7" 
              alt="Artisan en vélos cargo à Angers" 
              className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-[2000ms] group-hover:scale-105"
              referrerPolicy="no-referrer"
            />
            {/* Overlay - deeper gradient for text legibility, but allowing the bike to show on the right */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#141414] via-[#141414]/40 to-transparent" />
            
            <div className="relative z-10 h-full flex flex-col justify-center px-8 md:px-16 max-w-4xl">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <span className="px-4 py-1.5 bg-[#5A5A40] text-white rounded-full text-[10px] md:text-[11px] font-bold uppercase tracking-[0.2em]">
                    Angers Transition Durable
                  </span>
                  <div className="h-px w-12 bg-white/30 hidden sm:block" />
                  <span className="text-white/40 text-[10px] md:text-[11px] font-bold uppercase tracking-widest hidden sm:block">
                    Eco-Logistique
                  </span>
                </div>
                
                <h2 className="text-4xl md:text-7xl font-serif italic mb-8 leading-[0.9] text-white tracking-tight">
                  L'artisanat <br />
                  <span className="text-[#A5A58D]">à propulsion humaine.</span>
                </h2>
                
                <p className="text-white/70 text-base md:text-xl mb-12 leading-relaxed max-w-xl">
                  Découvrez la nouvelle génération d'artisans angevins. Plus proches, plus réactifs et 100% décarbonés, ils réinventent le service en ville au guidon de leurs cargos.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                  <button 
                    onClick={() => {
                      const el = document.getElementById('search-input');
                      el?.focus();
                      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }}
                    className="px-10 py-5 bg-white text-[#141414] rounded-2xl font-bold uppercase tracking-widest hover:bg-[#F5F5F0] transition-all hover:scale-105 active:scale-95 shadow-2xl flex items-center gap-3"
                  >
                    Trouver un artisan
                    <Plus className="w-4 h-4" />
                  </button>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex -space-x-3">
                      {[1,2,3,4].map(i => (
                        <img 
                          key={i}
                          src={`https://i.pravatar.cc/100?img=${i+20}`} 
                          className="w-10 h-10 rounded-full border-2 border-[#141414] object-cover bg-white"
                          referrerPolicy="no-referrer"
                          alt="Artisan"
                        />
                      ))}
                      <div className="w-10 h-10 rounded-full border-2 border-[#141414] bg-[#5A5A40] flex items-center justify-center text-white text-[10px] font-bold">
                        +30
                      </div>
                    </div>
                    <div className="text-white/60 text-[10px] font-bold uppercase tracking-widest leading-tight">
                      Rejoignez le <br /> mouvement local
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
            
            {/* Scroll Indicator */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
              className="absolute bottom-10 left-1/2 -translate-x-1/2 hidden md:flex flex-col items-center gap-3 text-white/30"
            >
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] rotate-90 mb-4 origin-left">Scroll</span>
            </motion.div>
          </div>
        </section>

        {/* Impact Dashboard */}
        <section className="mb-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-white p-8 rounded-[2rem] border border-[#141414]/5 shadow-xl shadow-[#141414]/5"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-amber-50 rounded-2xl text-amber-700">
                  <Users className="w-6 h-6" />
                </div>
                <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#141414]/40">Le Réseau</h4>
              </div>
              <p className="text-4xl font-serif italic mb-2">32</p>
              <p className="text-xs text-[#141414]/60 leading-relaxed font-medium">Artisans certifiés "Boîtes à Vélo" sur Angers</p>
            </motion.div>

            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-white p-8 rounded-[2rem] border border-[#141414]/5 shadow-xl shadow-[#141414]/5"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-700">
                  <TrendingDown className="w-6 h-6" />
                </div>
                <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#141414]/40">Impact CO2</h4>
              </div>
              <p className="text-4xl font-serif italic mb-2">-92%</p>
              <p className="text-xs text-[#141414]/60 leading-relaxed font-medium">D'émissions par rapport à un utilitaire diesel</p>
            </motion.div>

            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-white p-8 rounded-[2rem] border border-[#141414]/5 shadow-xl shadow-[#141414]/5"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-sky-50 rounded-2xl text-sky-700">
                  <Leaf className="w-6 h-6" />
                </div>
                <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#141414]/40">Qualité d'air</h4>
              </div>
              <p className="text-4xl font-serif italic mb-2">Pure</p>
              <p className="text-xs text-[#141414]/60 leading-relaxed font-medium">Zéro oxyde d'azote rejeté lors de chaque intervention</p>
            </motion.div>

            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-[#5A5A40] p-8 rounded-[2rem] text-white shadow-2xl shadow-[#5A5A40]/30 relative overflow-hidden"
            >
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 bg-white/20 rounded-2xl text-white">
                    <Trophy className="w-6 h-6" />
                  </div>
                  <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/50">Angers 2025</h4>
                </div>
                <p className="text-xl font-bold leading-tight mb-2">Ville de Demain</p>
                <p className="text-xs text-white/70 leading-relaxed">Lauréat de l'appel à projets "Mobilités Durables"</p>
              </div>
              <Bike className="absolute -bottom-8 -right-8 w-32 h-32 text-white/5 rotate-12" />
            </motion.div>
          </div>
        </section>

        {/* Filters & Discovery */}
        <div className="mb-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 border-b border-[#141414]/10 pb-8">
            <div>
              <h3 className="text-2xl font-serif italic mb-2">Explorez les talents locaux</h3>
              <p className="text-sm text-[#141414]/60">Sélectionnez une catégorie pour découvrir vos futurs partenaires.</p>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                className={`px-6 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${
                  showFavoritesOnly 
                  ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' 
                  : 'bg-white text-[#141414]/60 hover:bg-[#141414]/5 border border-[#141414]/10'
                }`}
              >
                <Heart className={`w-3.5 h-3.5 ${showFavoritesOnly ? 'fill-current' : ''}`} />
                Mes Favoris
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 overflow-x-auto pb-4 scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-8 py-3.5 rounded-2xl text-sm font-bold transition-all whitespace-nowrap shrink-0 flex items-center gap-3 ${
                  selectedCategory === cat 
                  ? 'bg-[#5A5A40] text-[#F5F5F0] shadow-2xl shadow-[#5A5A40]/30 scale-105' 
                  : 'bg-white text-[#141414]/60 hover:bg-[#141414]/5 border border-[#141414]/10 hover:border-[#5A5A40]/30'
                }`}
              >
                {cat !== 'Tous' && CATEGORY_ICONS[cat as Category]}
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Results Section */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredEntrepreneurs.map((pro) => (
                <motion.div
                  layout
                  key={pro.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="group bg-white rounded-3xl overflow-hidden border border-[#141414]/5 hover:border-[#5A5A40]/30 transition-all shadow-sm hover:shadow-xl flex flex-col"
                >
                  {pro.image && (
                    <div className="h-44 overflow-hidden relative">
                      <img 
                        src={pro.image} 
                        alt={pro.name} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                      <button 
                        onClick={(e) => toggleFavorite(pro.id, e)}
                        className={`absolute top-4 right-4 p-2 rounded-full backdrop-blur-md transition-all z-10 ${
                          favorites.includes(pro.id) ? 'bg-red-500 text-white shadow-lg shadow-red-500/30' : 'bg-white/20 text-white hover:bg-white/40'
                        }`}
                      >
                        <Heart className={`w-3.5 h-3.5 ${favorites.includes(pro.id) ? 'fill-current' : ''}`} />
                      </button>
                      {pro.co2Saved && (
                        <div className="absolute bottom-4 left-4 flex items-center gap-1.5 px-2 py-0.5 bg-white/90 backdrop-blur-md text-[#5A5A40] rounded-md text-[9px] font-bold shadow-sm">
                          <Zap className="w-2.5 h-2.5" />
                          -{pro.co2Saved}kg CO2/an
                        </div>
                      )}
                    </div>
                  )}
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#F5F5F0] text-[#5A5A40] rounded-full text-[11px] font-bold uppercase tracking-wider">
                          {CATEGORY_ICONS[pro.category]}
                          {pro.category}
                        </span>
                        {pro.stats?.yearsActive && (
                          <span className="text-[10px] text-[#141414]/40 font-medium">
                            Depuis {pro.stats.yearsActive} ans
                          </span>
                        )}
                      </div>
                      
                      <h3 className="text-xl font-bold mb-1 group-hover:text-[#5A5A40] transition-colors">{pro.name}</h3>
                      <div className="flex flex-col gap-1 mb-3">
                        <div className="flex items-center gap-2">
                          <StarRating rating={pro.reviews?.reduce((acc, r) => acc + r.rating, 0) ? (pro.reviews?.reduce((acc, r) => acc + r.rating, 0) / (pro.reviews?.length || 1)) : 5} />
                          <span className="text-[10px] font-bold text-[#141414]/40 uppercase tracking-tighter">
                            ({pro.reviews?.length || 0} avis)
                          </span>
                        </div>
                        {pro.siret && (
                          <span className="text-[9px] font-mono text-[#141414]/30 uppercase">SIRET: {pro.siret}</span>
                        )}
                      </div>
                      <p className="text-sm text-[#141414]/60 leading-relaxed mb-6 line-clamp-3">{pro.description}</p>
                      
                      <div className="space-y-2.5 mb-6">
                        <div className="flex items-start gap-3 text-sm text-[#141414]/70">
                          <MapPin className="w-4 h-4 mt-0.5 text-[#5A5A40]" />
                          <span>{pro.location}</span>
                        </div>
                      </div>

                      {/* Profile & Reviews Section Toggle */}
                      <div className="mb-6 space-y-3">
                        <button 
                          onClick={() => setSelectedPro(pro)}
                          className="flex items-center gap-2 text-xs font-bold text-[#141414] uppercase tracking-wider hover:text-[#5A5A40] transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Détails du profil
                        </button>
                        
                        <button 
                          onClick={() => setActiveReviewProId(activeReviewProId === pro.id ? null : pro.id)}
                          className="flex items-center gap-2 text-xs font-bold text-[#5A5A40] uppercase tracking-wider hover:opacity-70 transition-opacity"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          {activeReviewProId === pro.id ? 'Masquer les avis' : 'Voir les avis'}
                        </button>

                        <AnimatePresence>
                          {activeReviewProId === pro.id && (
                            <motion.div 
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden mt-4 pt-4 border-t border-[#141414]/5"
                            >
                              {/* List Reviews */}
                              <div className="space-y-4 mb-6 max-h-48 overflow-y-auto pr-2 scrollbar-hide">
                                {pro.reviews?.map((rev) => (
                                  <div key={rev.id} className="bg-[#F5F5F0]/50 p-3 rounded-2xl">
                                    <div className="flex justify-between items-center mb-1">
                                      <span className="text-xs font-bold">{rev.userName}</span>
                                      <span className="text-[10px] opacity-40">{rev.date}</span>
                                    </div>
                                    <StarRating rating={rev.rating} size={10} />
                                    <p className="text-xs text-[#141414]/70 mt-1.5">{rev.comment}</p>
                                  </div>
                                ))}
                                {(!pro.reviews || pro.reviews.length === 0) && (
                                  <p className="text-xs text-[#141414]/40 italic">Aucun avis pour le moment.</p>
                                )}
                              </div>

                              {/* Add Review Form */}
                              <div className="bg-[#141414] p-4 rounded-2xl text-[#F5F5F0]">
                                <h4 className="text-[10px] font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                                  <Plus className="w-3 h-3" />
                                  Laisser un avis
                                </h4>
                                <div className="space-y-3">
                                  <input 
                                    type="text" 
                                    placeholder="Votre nom"
                                    className="w-full bg-[#F5F5F0]/10 border-none rounded-lg text-xs p-2 placeholder-[#F5F5F0]/30 focus:ring-1 focus:ring-[#5A5A40]"
                                    value={newReview.userName}
                                    onChange={(e) => setNewReview({ ...newReview, userName: e.target.value })}
                                  />
                                  <div className="flex items-center gap-2 px-1">
                                    <span className="text-[10px] opacity-50 uppercase font-bold">Note :</span>
                                    <div className="flex gap-1">
                                      {[1, 2, 3, 4, 5].map((s) => (
                                        <button 
                                          key={s}
                                          onClick={() => setNewReview({ ...newReview, rating: s })}
                                        >
                                          <Star 
                                            size={14} 
                                            className={`${s <= newReview.rating ? 'fill-yellow-400 text-yellow-400' : 'text-[#F5F5F0]/20'}`} 
                                          />
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                  <textarea 
                                    placeholder="Votre message..."
                                    className="w-full bg-[#F5F5F0]/10 border-none rounded-lg text-xs p-2 h-16 resize-none placeholder-[#F5F5F0]/30 focus:ring-1 focus:ring-[#5A5A40]"
                                    value={newReview.comment}
                                    onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                                  />
                                  <button 
                                    onClick={() => handleAddReview(pro.id)}
                                    className="w-full py-2 bg-[#5A5A40] hover:bg-[#6A6A50] text-[#F5F5F0] rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2"
                                  >
                                    <Send className="w-3 h-3" />
                                    Envoyer l'avis
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                  <div className="flex flex-wrap gap-2 pt-6 border-t border-[#141414]/5">
                    <div className="w-full flex items-center justify-between mb-2">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-[#141414]/30 flex items-center gap-1">
                          <Share2 className="w-2.5 h-2.5" /> Partager
                        </span>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => shareOnSocial('facebook', pro)}
                            className="p-1.5 hover:bg-[#1877F2]/10 text-[#141414]/40 hover:text-[#1877F2] transition-colors rounded-lg"
                            title="Partager sur Facebook"
                          >
                            <Facebook className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => shareOnSocial('twitter', pro)}
                            className="p-1.5 hover:bg-[#1DA1F2]/10 text-[#141414]/40 hover:text-[#1DA1F2] transition-colors rounded-lg"
                            title="Partager sur Twitter"
                          >
                            <Twitter className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => shareOnSocial('linkedin', pro)}
                            className="p-1.5 hover:bg-[#0A66C2]/10 text-[#141414]/40 hover:text-[#0A66C2] transition-colors rounded-lg"
                            title="Partager sur LinkedIn"
                          >
                            <Linkedin className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {pro.contact.website && (
                        <a 
                          href={pro.contact.website} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-black text-white rounded-xl text-xs font-bold hover:bg-[#5A5A40] transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Site
                        </a>
                      )}
                      {pro.contact.phone && (
                        <a 
                          href={`tel:${pro.contact.phone}`}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#5A5A40] text-white rounded-xl text-xs font-bold hover:bg-[#4A4A30] transition-colors"
                        >
                          <Phone className="w-3 h-3" />
                          Appeler
                        </a>
                      )}
                      {pro.contact.email && (
                        <a 
                          href={`mailto:${pro.contact.email}`}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-[#141414]/10 rounded-xl text-xs font-bold hover:bg-[#141414] hover:text-white transition-all"
                        >
                          <Mail className="w-3 h-3" />
                          Email
                        </a>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="h-[600px] w-full rounded-[2.5rem] overflow-hidden border border-[#141414]/10 shadow-2xl relative">
            <MapContainer 
              center={[47.4710, -0.5520]} 
              zoom={14} 
              style={{ height: '100%', width: '100%' }}
              className="z-0"
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              {filteredEntrepreneurs.map((pro) => (
                <Marker 
                  key={pro.id} 
                  position={pro.coordinates}
                >
                  <Popup>
                    <div className="p-2 min-w-[200px]">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="p-1.5 bg-[#5A5A40] text-white rounded-lg scale-75">
                          {CATEGORY_ICONS[pro.category]}
                        </span>
                        <h3 className="font-bold text-sm m-0">{pro.name}</h3>
                      </div>
                      <p className="text-xs text-gray-600 mb-3 line-clamp-2">{pro.description}</p>
                      <button 
                        onClick={() => setSelectedPro(pro)}
                        className="w-full py-1.5 bg-[#141414] text-white text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-[#5A5A40] transition-colors"
                      >
                        Voir le profil
                      </button>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
            
            {/* Custom Legend */}
            <div className="absolute bottom-6 left-6 bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-[#141414]/10 shadow-xl z-[400] flex flex-col gap-2">
              <span className="text-[9px] font-bold uppercase tracking-widest text-[#141414]/40 mb-1 leading-none">Artisans par zone</span>
              <div className="flex items-center gap-2 text-xs font-medium">
                <div className="w-2 h-2 rounded-full bg-[#5A5A40]" />
                {filteredEntrepreneurs.length} professionnels trouvés
              </div>
            </div>
          </div>
        )}

        {/* Call to Action for Artisans */}
        <section className="mt-20 mb-20 bg-[#5A5A40] text-white rounded-[2.5rem] p-8 md:p-16 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-md">
            <h3 className="text-3xl font-serif italic mb-4">Vous êtes un artisan à vélo ?</h3>
            <p className="text-white/70 mb-0">Rejoignez le premier réseau d'artisans cyclomobiles à Angers et boostez votre visibilité auprès des clients locaux.</p>
          </div>
          <button 
            onClick={() => setIsRegistering(true)}
            className="px-8 py-4 bg-white text-[#141414] rounded-full font-bold uppercase tracking-widest hover:bg-[#F5F5F0] transition-all shadow-xl shadow-black/10"
          >
            Créer mon profil artisan
          </button>
        </section>

        {filteredEntrepreneurs.length === 0 && (
          <div className="text-center py-20">
            <div className="inline-block p-4 bg-[#141414]/5 rounded-full mb-4">
              <Search className="w-8 h-8 text-[#141414]/20" />
            </div>
            <h3 className="text-lg font-medium text-[#141414]/60">Aucun artisan trouvé</h3>
            <p className="text-sm text-[#141414]/40 mt-1">Essayez d'ajuster vos filtres ou votre recherche.</p>
          </div>
        )}

        {/* Footer Info */}
        <footer className="mt-20 pt-12 border-t border-[#141414]/10 grid grid-cols-1 md:grid-cols-3 gap-8 pb-12">
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest opacity-40">Pourquoi le vélo ?</h4>
            <ul className="space-y-2 text-sm text-[#141414]/70 italic">
              <li>"Le vélo instaure une proximité qui rassure"</li>
              <li>"Gain de temps : pas de bouchons, pas de stationnement"</li>
              <li>"Coût annuel : 825€ contre 6872€ pour un utilitaire"</li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest opacity-40">L'étude ADEME</h4>
            <p className="text-sm text-[#141414]/60 leading-relaxed">
              Selon l'Agence de transition écologique, le vélo cargo est l'outil idéal pour les circuits courts et les zones urbaines denses.
            </p>
          </div>
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest opacity-40">À propos</h4>
            <p className="text-sm text-[#141414]/60 leading-relaxed">
              VéloPro Angers est inspiré par le dynamisme des artisans de la ville d'Angers et le collectif Sicle.
            </p>
          </div>
        </footer>
      </main>

    </div>
  );
}

