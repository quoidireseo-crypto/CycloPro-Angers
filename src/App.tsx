/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from "react";
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
  User as UserIcon,
  Facebook,
  Twitter,
  Linkedin,
  Share2,
  Camera,
  LogOut,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  auth,
  db,
  signInWithGoogle,
  loginWithEmail,
  registerWithEmail,
} from "./firebase";
import {
  collection,
  query,
  onSnapshot,
  setDoc,
  doc,
  getDocs,
  updateDoc,
  deleteDoc,
  arrayUnion,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import type { User } from "firebase/auth";
import { entrepreneurs as initialData } from "./data";
import { Category, Entrepreneur, Review } from "./types";
import OnboardingFlow from "./components/OnboardingFlow";

enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null,
) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path,
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Fix for Leaflet default icon issues in React
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const CATEGORY_ICONS: Record<Category, React.ReactNode> = {
  Paysage: <Leaf className="w-4 h-4" />,
  Plomberie: <Droplets className="w-4 h-4" />,
  Menuiserie: <Hammer className="w-4 h-4" />,
  Électricité: <Zap className="w-4 h-4" />,
  Livraison: <Package className="w-4 h-4" />,
  Bâtiment: <Construction className="w-4 h-4" />,
  Réparation: <Wrench className="w-4 h-4" />,
  Solidarité: <Heart className="w-4 h-4" />,
  Logistique: <Boxes className="w-4 h-4" />,
};

function StarRating({ rating, size = 12 }: { rating: number; size?: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          className={`${i <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200 fill-gray-200"}`}
        />
      ))}
    </div>
  );
}

export default function App() {
  const [data, setData] = useState<Entrepreneur[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category | "Tous">(
    "Tous",
  );
  const [activeReviewProId, setActiveReviewProId] = useState<string | null>(
    null,
  );
  const [selectedPro, setSelectedPro] = useState<Entrepreneur | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [loggedPro, setLoggedPro] = useState<Entrepreneur | null>(null);
  const [newReview, setNewReview] = useState({
    userName: "",
    rating: 5,
    comment: "",
  });

  const [activeTab, setActiveTab] = useState<"profile" | "messages" | "stats">(
    "profile",
  );
  const [dashboardForm, setDashboardForm] = useState<any>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem("angers_artisans_favs");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setIsAuthLoading(false);
    });

    const unsubData = onSnapshot(
      collection(db, "entrepreneurs"),
      (snapshot) => {
        const proList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Entrepreneur[];
        setData(proList);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, "entrepreneurs");
      },
    );

    return () => {
      unsubAuth();
      unsubData();
    };
  }, []); // Remove data from dependencies

  // Seperate effect for updating loggedPro when data or user changes
  useEffect(() => {
    if (currentUser && data.length > 0) {
      const found = data.find((p) => (p as any).ownerId === currentUser.uid);
      if (found) {
        setLoggedPro(found);
        // Initialize dashboard form with profile data
        if (!dashboardForm) {
          setDashboardForm({
            name: found.name,
            category: found.category,
            description: found.description,
            longDescription: found.longDescription || "",
            location: found.location,
            email: found.contact.email,
            phone: found.contact.phone || "",
            website: found.contact.website || "",
            image: found.image || "",
          });
        }
      }
    } else if (!currentUser) {
      setLoggedPro(null);
      setDashboardForm(null);
    }
  }, [currentUser, data]);

  useEffect(() => {
    localStorage.setItem("angers_artisans_favs", JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id],
    );
  };

  const shareOnSocial = (
    platform: "facebook" | "twitter" | "linkedin",
    pro: Entrepreneur,
  ) => {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(
      `Découvrez ${pro.name}, un artisan à vélo à Angers ! 🚲✨`,
    );

    const shareUrls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      twitter: `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
    };

    window.open(shareUrls[platform], "_blank", "noreferrer");
  };

  const filteredEntrepreneurs = useMemo(() => {
    let result = data.filter((pro) => {
      const searchTerms = searchQuery.toLowerCase();
      const matchesSearch =
        pro.name.toLowerCase().includes(searchTerms) ||
        pro.description.toLowerCase().includes(searchTerms) ||
        pro.category.toLowerCase().includes(searchTerms) ||
        pro.location.toLowerCase().includes(searchTerms);
      const matchesCategory =
        selectedCategory === "Tous" || pro.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });

    if (showFavoritesOnly) {
      result = result.filter((pro) => favorites.includes(pro.id));
    }

    return result;
  }, [searchQuery, selectedCategory, data, favorites, showFavoritesOnly]);

  const categories: (Category | "Tous")[] = [
    "Tous",
    "Paysage",
    "Plomberie",
    "Menuiserie",
    "Électricité",
    "Livraison",
    "Bâtiment",
    "Réparation",
    "Solidarité",
    "Logistique",
  ];

  const handleAddReview = async (proId: string) => {
    if (!currentUser) {
      alert("Vous devez être connecté pour laisser un avis.");
      setIsDashboardOpen(true);
      return;
    }
    if (!newReview.userName || !newReview.comment) return;

    const review: Review = {
      id: Date.now().toString(),
      userName: newReview.userName,
      rating: newReview.rating,
      comment: newReview.comment,
      date: new Date().toISOString(),
    };

    const path = `entrepreneurs/${proId}`;
    try {
      await updateDoc(doc(db, path), {
        reviews: arrayUnion(review),
        updatedAt: serverTimestamp(),
      });
      setNewReview({ userName: "", rating: 5, comment: "" });
      setActiveReviewProId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F6F2] text-[#0F1A15] font-sans overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#F8F6F2]/80 backdrop-blur-md border-b border-[#0F1A15]/10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 w-full">
          <div className="flex items-center justify-between w-full md:w-auto shrink-0">
            <div className="flex items-center gap-3">
              <div className="bg-[#E04A26] p-2 rounded-xl">
                <Bike className="w-6 h-6 text-[#F8F6F2]" />
              </div>
              <div>
                <h1 className="text-xl font-semibold tracking-tight">
                  VéloPro Angers
                </h1>
                <p className="text-[10px] text-[#E04A26] font-bold uppercase tracking-wider">
                  Artisans à vélo
                </p>
              </div>
            </div>
            {!loggedPro && (
              <button
                onClick={() => setIsRegistering(true)}
                className="md:hidden px-3 py-1.5 bg-[#0F1A15] text-white rounded-full text-[9px] font-bold uppercase tracking-widest hover:bg-[#E04A26] transition-colors whitespace-nowrap"
              >
                Inscrire
              </button>
            )}
            <button
              onClick={() => setIsDashboardOpen(true)}
              className="md:hidden ml-2 p-2 bg-white border border-[#0F1A15]/10 rounded-full text-[#0F1A15]"
            >
              <Users className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile search + category filter */}
          <div className="md:hidden flex items-center bg-white border border-[#0F1A15]/10 rounded-full shadow-sm overflow-hidden focus-within:ring-2 focus-within:ring-[#E04A26]/20 transition-all">
            <Search className="ml-3 w-4 h-4 text-[#0F1A15]/40 shrink-0" />
            <input
              type="text"
              placeholder="Artisan, service..."
              className="flex-1 pl-2 pr-3 py-2 bg-transparent text-sm focus:outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="h-5 w-px bg-[#0F1A15]/10 shrink-0" />
            <div className="relative flex items-center pr-1">
              <select
                value={selectedCategory}
                onChange={(e) =>
                  setSelectedCategory(e.target.value as Category | "Tous")
                }
                className="appearance-none bg-transparent text-xs font-bold text-[#E04A26] pl-3 pr-6 py-2 focus:outline-none cursor-pointer"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <Filter className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[#0F1A15]/30 pointer-events-none" />
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            {/* Search + category filter on desktop */}
            <div className="hidden md:flex items-center flex-1 max-w-lg bg-white border border-[#0F1A15]/10 rounded-full shadow-sm overflow-hidden focus-within:ring-2 focus-within:ring-[#E04A26]/20 transition-all">
              <Search className="ml-3 w-4 h-4 text-[#0F1A15]/40 shrink-0" />
              <input
                id="search-input"
                type="text"
                placeholder="Artisan, service..."
                className="flex-1 pl-2 pr-3 py-2 bg-transparent text-sm focus:outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <div className="h-5 w-px bg-[#0F1A15]/10 shrink-0" />
              <div className="relative flex items-center pr-1">
                <select
                  value={selectedCategory}
                  onChange={(e) =>
                    setSelectedCategory(e.target.value as Category | "Tous")
                  }
                  className="appearance-none bg-transparent text-xs font-bold text-[#E04A26] pl-3 pr-6 py-2 focus:outline-none cursor-pointer"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <Filter className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[#0F1A15]/30 pointer-events-none" />
              </div>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
              <button
                onClick={() => setIsDashboardOpen(true)}
                className="hidden md:flex items-center gap-2 px-4 py-2 bg-white border border-[#0F1A15]/10 text-[#0F1A15] rounded-full text-xs font-bold uppercase tracking-widest hover:bg-[#0F1A15]/5 transition-colors whitespace-nowrap"
              >
                <Users className="w-4 h-4" />
                Mon Espace
              </button>
              {!loggedPro && (
                <button
                  onClick={() => setIsRegistering(true)}
                  className="hidden md:block px-4 py-2 bg-[#0F1A15] text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-[#E04A26] transition-colors whitespace-nowrap"
                >
                  Devenir partenaire
                </button>
              )}

              <div className="flex items-center gap-1.5 md:gap-2">
                <div className="flex bg-white border border-[#0F1A15]/10 rounded-full p-0.5 md:p-1 shadow-sm">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`px-3 md:px-4 py-1.5 rounded-full text-[9px] md:text-[10px] font-bold uppercase tracking-widest transition-all ${
                      viewMode === "grid"
                        ? "bg-[#E04A26] text-white"
                        : "text-[#0F1A15]/40 hover:text-[#0F1A15]"
                    }`}
                  >
                    Liste
                  </button>
                  <button
                    onClick={() => setViewMode("map")}
                    className={`px-3 md:px-4 py-1.5 rounded-full text-[9px] md:text-[10px] font-bold uppercase tracking-widest transition-all ${
                      viewMode === "map"
                        ? "bg-[#E04A26] text-white"
                        : "text-[#0F1A15]/40 hover:text-[#0F1A15]"
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
        {/* Onboarding / Registration Modal */}
        <AnimatePresence>
          {(isRegistering || (isDashboardOpen && !loggedPro)) && (
            <OnboardingFlow
              isOpen={true}
              onClose={() => {
                setIsRegistering(false);
                setIsDashboardOpen(false);
              }}
              currentUser={currentUser}
              entrepreneurs={data}
            />
          )}
          {isDashboardOpen && loggedPro && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="relative w-full h-full md:h-[90vh] bg-[#F8F6F2] md:rounded-[3rem] overflow-hidden flex flex-col shadow-2xl"
            >
              <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                {/* Sidebar */}
                <div className="w-full md:w-80 bg-[#0F1A15] text-white p-8 shrink-0 flex flex-col">
                  <div className="flex items-center gap-3 mb-12">
                    <div className="bg-[#E04A26] p-2 rounded-xl">
                      <Bike className="w-5 h-5" />
                    </div>
                    <span className="font-bold tracking-tight uppercase text-xs">
                      Dashboard Artisan
                    </span>
                  </div>

                  <div className="flex flex-col items-center mb-12">
                    <div className="group relative w-24 h-24 rounded-3xl overflow-hidden mb-4 border-2 border-[#E04A26] cursor-pointer">
                      <img
                        src={
                          loggedPro.image ||
                          "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop"
                        }
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        alt={loggedPro.name}
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <Camera className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <h3 className="text-xl font-serif italic text-center">
                      {loggedPro.name}
                    </h3>
                    <p className="text-[10px] text-[#B07D6D] font-bold uppercase tracking-widest mt-2">
                      {loggedPro.category}
                    </p>
                  </div>

                  <nav className="space-y-2 flex-1">
                    <button
                      onClick={() => setActiveTab("profile")}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === "profile" ? "bg-[#E04A26] text-white shadow-lg shadow-[#E04A26]/20" : "text-white/60 hover:bg-white/5"}`}
                    >
                      <Users className="w-4 h-4" /> Mon Profil
                    </button>
                    <button
                      onClick={() => setActiveTab("messages")}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === "messages" ? "bg-[#E04A26] text-white shadow-lg shadow-[#E04A26]/20" : "text-white/60 hover:bg-white/5"}`}
                    >
                      <MessageSquare className="w-4 h-4" /> Messagerie
                      <span className="ml-auto bg-green-500 w-2 h-2 rounded-full animate-pulse" />
                    </button>
                    <button
                      onClick={() => setActiveTab("stats")}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === "stats" ? "bg-[#E04A26] text-white shadow-lg shadow-[#E04A26]/20" : "text-white/60 hover:bg-white/5"}`}
                    >
                      <TrendingDown className="w-4 h-4" /> Statistiques
                    </button>
                  </nav>

                  <button
                    onClick={async () => {
                      await signOut(auth);
                      setIsDashboardOpen(false);
                      setLoggedPro(null);
                    }}
                    className="mt-auto flex items-center gap-3 p-3 text-red-400 hover:text-red-300 transition-colors text-xs font-bold uppercase tracking-widest"
                  >
                    <LogOut className="w-4 h-4" /> Déconnexion
                  </button>
                </div>

                {/* Main Content */}
                <div className="flex-1 overflow-y-auto p-8 md:p-12">
                  <header className="flex justify-between items-center mb-12">
                    <div>
                      <h2 className="text-3xl font-serif italic">
                        {activeTab === "profile" && "Profil Professionnel"}
                        {activeTab === "messages" && "Messagerie & Contacts"}
                        {activeTab === "stats" && "Impact & Performance"}
                      </h2>
                      <p className="text-sm text-[#0F1A15]/40 mt-1">
                        {activeTab === "profile" &&
                          "Mettez à jour vos informations et votre vitrine."}
                        {activeTab === "messages" &&
                          "Gérez vos demandes de clients (En direct)."}
                        {activeTab === "stats" &&
                          "Visualisez votre impact écologique à Angers."}
                      </p>
                    </div>
                  </header>
                  {activeTab === "profile" && dashboardForm && (
                    <article className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                      <div className="space-y-8">
                        <div className="bg-white p-8 rounded-[2rem] border border-[#0F1A15]/5 space-y-6">
                          <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-[#B07D6D]">
                            Vitrine Publique
                          </h4>
                          <div className="space-y-4">
                            <div>
                              <label className="block text-[10px] font-bold uppercase tracking-widest text-[#0F1A15]/40 mb-2">
                                Nom commercial
                              </label>
                              <input
                                value={dashboardForm.name}
                                onChange={(e) =>
                                  setDashboardForm({
                                    ...dashboardForm,
                                    name: e.target.value,
                                  })
                                }
                                className="w-full bg-[#F8F6F2] border-none rounded-xl p-3 text-sm focus:ring-1 focus:ring-[#E04A26] outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold uppercase tracking-widest text-[#0F1A15]/40 mb-2">
                                URL de l'image de profil
                              </label>
                              <input
                                value={dashboardForm.image}
                                onChange={(e) =>
                                  setDashboardForm({
                                    ...dashboardForm,
                                    image: e.target.value,
                                  })
                                }
                                placeholder="Lien vers une image Unsplash ou autre"
                                className="w-full bg-[#F8F6F2] border-none rounded-xl p-3 text-sm focus:ring-1 focus:ring-[#E04A26] outline-none"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#0F1A15]/40 mb-2">
                                  Ville / Quartier
                                </label>
                                <input
                                  value={dashboardForm.location}
                                  onChange={(e) =>
                                    setDashboardForm({
                                      ...dashboardForm,
                                      location: e.target.value,
                                    })
                                  }
                                  className="w-full bg-[#F8F6F2] border-none rounded-xl p-3 text-sm focus:ring-1 focus:ring-[#E04A26] outline-none"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#0F1A15]/40 mb-2">
                                  Catégorie
                                </label>
                                <select
                                  value={dashboardForm.category}
                                  onChange={(e) =>
                                    setDashboardForm({
                                      ...dashboardForm,
                                      category: e.target.value as Category,
                                    })
                                  }
                                  className="w-full bg-[#F8F6F2] border-none rounded-xl p-3 text-sm focus:ring-1 focus:ring-[#E04A26] outline-none"
                                >
                                  {categories
                                    .filter((c) => c !== "Tous")
                                    .map((cat) => (
                                      <option key={cat} value={cat}>
                                        {cat}
                                      </option>
                                    ))}
                                </select>
                              </div>
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold uppercase tracking-widest text-[#0F1A15]/40 mb-2">
                                Slogan publicitaire
                              </label>
                              <textarea
                                value={dashboardForm.description}
                                onChange={(e) =>
                                  setDashboardForm({
                                    ...dashboardForm,
                                    description: e.target.value,
                                  })
                                }
                                className="w-full bg-[#F8F6F2] border-none rounded-xl p-3 text-sm h-16 resize-none focus:ring-1 focus:ring-[#E04A26] outline-none"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="bg-white p-8 rounded-[2rem] border border-[#0F1A15]/5 space-y-6">
                          <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-[#B07D6D]">
                            Contact Professionnel
                          </h4>
                          <div className="space-y-4">
                            <div>
                              <label className="block text-[10px] font-bold uppercase tracking-widest text-[#0F1A15]/40 mb-2">
                                Email
                              </label>
                              <input
                                value={dashboardForm.email}
                                onChange={(e) =>
                                  setDashboardForm({
                                    ...dashboardForm,
                                    email: e.target.value,
                                  })
                                }
                                className="w-full bg-[#F8F6F2] border-none rounded-xl p-3 text-sm focus:ring-1 focus:ring-[#E04A26] outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold uppercase tracking-widest text-[#0F1A15]/40 mb-2">
                                Téléphone
                              </label>
                              <input
                                value={dashboardForm.phone}
                                onChange={(e) =>
                                  setDashboardForm({
                                    ...dashboardForm,
                                    phone: e.target.value,
                                  })
                                }
                                className="w-full bg-[#F8F6F2] border-none rounded-xl p-3 text-sm focus:ring-1 focus:ring-[#E04A26] outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold uppercase tracking-widest text-[#0F1A15]/40 mb-2">
                                Site Web
                              </label>
                              <input
                                value={dashboardForm.website}
                                onChange={(e) =>
                                  setDashboardForm({
                                    ...dashboardForm,
                                    website: e.target.value,
                                  })
                                }
                                className="w-full bg-[#F8F6F2] border-none rounded-xl p-3 text-sm focus:ring-1 focus:ring-[#E04A26] outline-none"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-8">
                        <div className="bg-white p-8 rounded-[2rem] border border-[#0F1A15]/5 space-y-6">
                          <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-[#B07D6D]">
                            À propos (Détaillé)
                          </h4>
                          <textarea
                            value={dashboardForm.longDescription}
                            onChange={(e) =>
                              setDashboardForm({
                                ...dashboardForm,
                                longDescription: e.target.value,
                              })
                            }
                            placeholder="Racontez votre histoire, votre passion pour le vélo-cargo..."
                            className="w-full bg-[#F8F6F2] border-none rounded-xl p-4 text-sm h-48 resize-none focus:ring-1 focus:ring-[#E04A26] outline-none"
                          />
                        </div>

                        <div className="flex gap-4">
                          <button
                            onClick={async () => {
                              if (!loggedPro) return;
                              const path = `entrepreneurs/${loggedPro.id}`;
                              try {
                                const updatedData = {
                                  name: dashboardForm.name,
                                  description: dashboardForm.description,
                                  longDescription:
                                    dashboardForm.longDescription,
                                  location: dashboardForm.location,
                                  image: dashboardForm.image,
                                  category: dashboardForm.category,
                                  contact: {
                                    ...loggedPro.contact,
                                    email: dashboardForm.email,
                                    phone: dashboardForm.phone,
                                    website: dashboardForm.website,
                                  },
                                  updatedAt: serverTimestamp(),
                                };
                                await updateDoc(doc(db, path), updatedData);

                                const btn = document.getElementById("save-btn");
                                if (btn) {
                                  const originalText = btn.innerHTML;
                                  btn.innerHTML = "Sauvegardé ✓";
                                  btn.style.backgroundColor = "#16a34a";
                                  setTimeout(() => {
                                    btn.innerHTML = originalText;
                                    btn.style.backgroundColor = "#E04A26";
                                  }, 2000);
                                }
                              } catch (error) {
                                handleFirestoreError(
                                  error,
                                  OperationType.UPDATE,
                                  path,
                                );
                              }
                            }}
                            id="save-btn"
                            className="flex-1 py-4 bg-[#E04A26] text-white rounded-2xl font-bold uppercase tracking-widest hover:bg-[#B83A1C] transition-all active:scale-95 shadow-xl shadow-[#E04A26]/20"
                          >
                            Enregistrer les modifications
                          </button>
                          <button
                            onClick={() => setIsDashboardOpen(false)}
                            className="px-8 py-4 bg-white border border-[#0F1A15]/10 rounded-2xl font-bold uppercase tracking-widest text-[#0F1A15]/40 hover:bg-[#0F1A15]/5 transition-colors"
                          >
                            Quitter
                          </button>
                        </div>
                      </div>
                    </article>
                  )}

                  {activeTab === "messages" && (
                    <div className="space-y-6">
                      {[
                        {
                          id: 1,
                          sender: "Marie D.",
                          time: "Il y a 2h",
                          text: "Bonjour, seriez-vous disponible pour une livraison demain matin centre-ville ?",
                          read: false,
                        },
                        {
                          id: 2,
                          sender: "Association Cyclo",
                          time: "Hier",
                          text: "Bravo pour votre engagement ! Nous aimerions vous interviewer.",
                          read: true,
                        },
                        {
                          id: 3,
                          sender: "Jean-Pierre L.",
                          time: "Il y a 3 jours",
                          text: "Votre service de maintenance est top, merci pour le dépannage.",
                          read: true,
                        },
                      ].map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex items-start gap-6 p-6 rounded-3xl border transition-all ${msg.read ? "bg-white border-[#0F1A15]/5" : "bg-[#E04A26]/5 border-[#E04A26]/20 ring-1 ring-[#E04A26]/10"}`}
                        >
                          <div
                            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${msg.read ? "bg-[#0F1A15]/5" : "bg-[#E04A26]"}`}
                          >
                            <UserIcon
                              className={`w-6 h-6 ${msg.read ? "text-[#0F1A15]/40" : "text-white"}`}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center mb-1">
                              <h5 className="font-bold text-sm tracking-tight">
                                {msg.sender}
                              </h5>
                              <span className="text-[10px] font-bold uppercase tracking-widest text-[#0F1A15]/30">
                                {msg.time}
                              </span>
                            </div>
                            <p className="text-sm text-[#0F1A15]/60 line-clamp-2 leading-relaxed">
                              {msg.text}
                            </p>
                          </div>
                          <button className="px-4 py-2 bg-white border border-[#0F1A15]/10 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-[#0F1A15]/5 transition-colors">
                            Répondre
                          </button>
                        </div>
                      ))}
                      <div className="bg-[#0F1A15] p-8 rounded-[2rem] text-center">
                        <p className="text-white/40 text-xs font-bold uppercase tracking-widest">
                          Fin de messagerie
                        </p>
                      </div>
                    </div>
                  )}

                  {activeTab === "stats" && (
                    <div className="space-y-12">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-8 rounded-[2rem] border border-[#0F1A15]/5 space-y-4">
                          <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center">
                            <TrendingDown className="w-6 h-6" />
                          </div>
                          <div>
                            <span className="text-3xl font-bold">148</span>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-[#0F1A15]/30 ml-2">
                              Visites cette semaine
                            </span>
                          </div>
                        </div>
                        <div className="bg-white p-8 rounded-[2rem] border border-[#0F1A15]/5 space-y-4">
                          <div className="w-12 h-12 bg-green-500/10 text-green-500 rounded-2xl flex items-center justify-center">
                            <Leaf className="w-6 h-6" />
                          </div>
                          <div>
                            <span className="text-3xl font-bold">
                              {loggedPro.co2Saved || 85}
                            </span>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-[#0F1A15]/30 ml-2">
                              Kg CO2 économisés
                            </span>
                          </div>
                        </div>
                        <div className="bg-white p-8 rounded-[2rem] border border-[#0F1A15]/5 space-y-4">
                          <div className="w-12 h-12 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center">
                            <Star className="w-6 h-6" />
                          </div>
                          <div>
                            <span className="text-3xl font-bold">4.9/5</span>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-[#0F1A15]/30 ml-2">
                              Note moyenne
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-[#0F1A15] p-12 rounded-[3rem] text-white overflow-hidden relative">
                        <div className="relative z-10">
                          <h3 className="text-4xl font-serif italic mb-2 text-[#B07D6D]">
                            Progression Impact
                          </h3>
                          <p className="text-sm text-white/40 mb-12">
                            Votre contribution à la transition écologique
                            d'Angers.
                          </p>
                          <div className="h-64 flex items-end gap-2 group">
                            {[
                              40, 60, 45, 90, 65, 80, 100, 70, 85, 110, 95, 120,
                            ].map((val, i) => (
                              <div
                                key={i}
                                className="flex-1 bg-[#E04A26]/40 rounded-t-xl hover:bg-[#E04A26] transition-all cursor-crosshair relative group/bar"
                                style={{ height: `${val}%` }}
                              >
                                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white text-[#0F1A15] px-2 py-1 rounded-lg text-[10px] font-bold opacity-0 group-hover/bar:opacity-100 transition-opacity">
                                  {val}kg
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="flex justify-between mt-6 text-[10px] font-bold uppercase tracking-[0.2em] text-white/20">
                            <span>Janvier 2024</span>
                            <span>Décembre 2024</span>
                          </div>
                        </div>
                        <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-[#E04A26]/10 rounded-full blur-[100px]" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {selectedPro && (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-6">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedPro(null)}
                className="absolute inset-0 bg-[#0F1A15]/80 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-2xl bg-[#F8F6F2] rounded-[2.5rem] overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto"
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
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#E04A26] text-white rounded-full text-[11px] font-bold uppercase tracking-wider mb-3">
                          {CATEGORY_ICONS[selectedPro.category]}
                          {selectedPro.category}
                        </span>
                        <h2 className="text-3xl md:text-4xl font-serif italic">
                          {selectedPro.name}
                        </h2>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedPro(null)}
                      className="p-2 hover:bg-[#0F1A15]/5 rounded-full transition-colors"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </header>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                    <div className="md:col-span-2 space-y-6">
                      <div className="space-y-4">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-[#0F1A15]/40">
                          À propos
                        </h4>
                        <p className="text-[#0F1A15]/80 leading-relaxed text-lg">
                          {selectedPro.longDescription ||
                            selectedPro.description}
                        </p>
                      </div>

                      {selectedPro.stats && (
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-white p-4 rounded-2xl border border-[#0F1A15]/5">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-[#0F1A15]/40 block mb-1">
                              Actif depuis
                            </span>
                            <span className="text-xl font-bold">
                              {selectedPro.stats.yearsActive} ans
                            </span>
                          </div>
                          <div className="bg-white p-4 rounded-2xl border border-[#0F1A15]/5">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-[#0F1A15]/40 block mb-1">
                              Capacité Max
                            </span>
                            <span className="text-xl font-bold">
                              {selectedPro.stats.kgTransported} kg
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-widest text-[#0F1A15]/40">
                        Contact direct
                      </h4>
                      <div className="space-y-3">
                        {selectedPro.contact.phone && (
                          <a
                            href={`tel:${selectedPro.contact.phone}`}
                            className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-[#0F1A15]/5 hover:border-[#E04A26] transition-colors group"
                          >
                            <div className="p-2 bg-[#E04A26]/10 text-[#E04A26] rounded-xl group-hover:bg-[#E04A26] group-hover:text-white transition-colors">
                              <Phone className="w-4 h-4" />
                            </div>
                            <span className="text-sm font-medium">
                              {selectedPro.contact.phone}
                            </span>
                          </a>
                        )}
                        {selectedPro.contact.email && (
                          <a
                            href={`mailto:${selectedPro.contact.email}`}
                            className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-[#0F1A15]/5 hover:border-[#E04A26] transition-colors group"
                          >
                            <div className="p-2 bg-[#E04A26]/10 text-[#E04A26] rounded-xl group-hover:bg-[#E04A26] group-hover:text-white transition-colors">
                              <Mail className="w-4 h-4" />
                            </div>
                            <span className="text-sm font-medium">
                              {selectedPro.contact.email}
                            </span>
                          </a>
                        )}
                        {selectedPro.contact.website && (
                          <a
                            href={selectedPro.contact.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-[#0F1A15]/5 hover:border-[#E04A26] transition-colors group"
                          >
                            <div className="p-2 bg-[#E04A26]/10 text-[#E04A26] rounded-xl group-hover:bg-[#E04A26] group-hover:text-white transition-colors">
                              <ExternalLink className="w-4 h-4" />
                            </div>
                            <span className="text-sm font-medium">
                              Visiter le site
                            </span>
                          </a>
                        )}
                        <div className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-[#0F1A15]/5">
                          <div className="p-2 bg-[#E04A26]/10 text-[#E04A26] rounded-xl">
                            <MapPin className="w-4 h-4" />
                          </div>
                          <span className="text-sm font-medium">
                            {selectedPro.location}
                          </span>
                        </div>
                      </div>

                      {selectedPro.siret && (
                        <div className="pt-4 border-t border-[#0F1A15]/5 mb-4">
                          <span className="text-[10px] font-mono text-[#0F1A15]/40">
                            SIRET: {selectedPro.siret}
                          </span>
                        </div>
                      )}

                      <button
                        onClick={() => {
                          alert(
                            "Demande transmise ! L'artisan pourra vous répondre directement via son tableau de bord.",
                          );
                        }}
                        className="w-full py-4 bg-[#E04A26] text-white rounded-2xl font-bold uppercase tracking-widest hover:bg-[#B83A1C] transition-all hover:shadow-lg hover:shadow-[#E04A26]/30 active:scale-95 flex items-center justify-center gap-3"
                      >
                        <MessageSquare className="w-4 h-4" />
                        Envoyer un message
                      </button>
                    </div>
                  </div>

                  <div className="bg-[#0F1A15] rounded-[1.5rem] p-6 text-white">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#F8F6F2]/40 mb-4">
                      Derniers avis clients
                    </h4>
                    <div className="space-y-4">
                      {selectedPro.reviews?.slice(0, 3).map((rev) => (
                        <div
                          key={rev.id}
                          className="border-b border-white/10 pb-4 last:border-0 last:pb-0"
                        >
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-bold">
                              {rev.userName}
                            </span>
                            <span className="text-xs opacity-40">
                              {rev.date}
                            </span>
                          </div>
                          <StarRating rating={rev.rating} size={12} />
                          <p className="text-sm text-white/70 mt-2 italic">
                            "{rev.comment}"
                          </p>
                        </div>
                      ))}
                    </div>
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
            <div className="absolute inset-0 bg-gradient-to-r from-[#0F1A15] via-[#0F1A15]/40 to-transparent" />

            <div className="relative z-10 h-full flex flex-col justify-center px-8 md:px-16 max-w-4xl">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <span className="px-4 py-1.5 bg-[#E04A26] text-white rounded-full text-[10px] md:text-[11px] font-bold uppercase tracking-[0.2em]">
                    Angers Transition Durable
                  </span>
                  <div className="h-px w-12 bg-white/30 hidden sm:block" />
                  <span className="text-white/40 text-[10px] md:text-[11px] font-bold uppercase tracking-widest hidden sm:block">
                    Eco-Logistique
                  </span>
                </div>

                <h2 className="text-4xl md:text-7xl font-serif italic mb-8 leading-[0.9] text-white tracking-tight">
                  L'artisanat <br />
                  <span className="text-[#B07D6D]">à propulsion humaine.</span>
                </h2>

                <p className="text-white/70 text-base md:text-xl mb-12 leading-relaxed max-w-xl">
                  Découvrez la nouvelle génération d'artisans angevins. Plus
                  proches, plus réactifs et 100% décarbonés, ils réinventent le
                  service en ville au guidon de leurs cargos.
                </p>

                <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                  <button
                    onClick={() => {
                      const el = document.getElementById("search-input");
                      el?.focus();
                      el?.scrollIntoView({
                        behavior: "smooth",
                        block: "center",
                      });
                    }}
                    className="px-10 py-5 bg-white text-[#0F1A15] rounded-2xl font-bold uppercase tracking-widest hover:bg-[#F8F6F2] transition-all hover:scale-105 active:scale-95 shadow-2xl flex items-center gap-3"
                  >
                    Trouver un artisan
                    <Plus className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-4">
                    <div className="flex -space-x-3">
                      {[1, 2, 3, 4].map((i) => (
                        <img
                          key={i}
                          src={`https://i.pravatar.cc/100?img=${i + 20}`}
                          className="w-10 h-10 rounded-full border-2 border-[#0F1A15] object-cover bg-white"
                          referrerPolicy="no-referrer"
                          alt="Artisan"
                        />
                      ))}
                      <div className="w-10 h-10 rounded-full border-2 border-[#0F1A15] bg-[#E04A26] flex items-center justify-center text-white text-[10px] font-bold">
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
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] rotate-90 mb-4 origin-left">
                Scroll
              </span>
            </motion.div>
          </div>
        </section>

        {/* Impact Dashboard */}
        <section className="mb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div
              whileHover={{ y: -5 }}
              className="bg-amber-100 p-8 rounded-[2rem] border-2 border-[#0F1A15] shadow-[4px_4px_0_#0F1A15] relative overflow-hidden group transition-all"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-amber-200 border border-[#0F1A15] rounded-2xl text-[#0F1A15]">
                  <Users className="w-6 h-6" />
                </div>
              </div>
              <p className="oversized-number mb-4 text-[#0F1A15]">32</p>
              <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#0F1A15]/60 mb-2">
                Le Réseau
              </h4>
              <p className="text-sm text-[#0F1A15] font-medium">
                Artisans certifiés "Boîtes à Vélo" sur Angers
              </p>
            </motion.div>

            <motion.div
              whileHover={{ y: -5 }}
              className="bg-emerald-100 p-8 rounded-[2rem] border-2 border-[#0F1A15] shadow-[4px_4px_0_#0F1A15] relative overflow-hidden group transition-all"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-emerald-200 border border-[#0F1A15] rounded-2xl text-[#0F1A15]">
                  <TrendingDown className="w-6 h-6" />
                </div>
              </div>
              <p className="oversized-number mb-4 text-[#0F1A15]">
                -92<span className="text-4xl">%</span>
              </p>
              <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#0F1A15]/60 mb-2">
                Impact CO2
              </h4>
              <p className="text-sm text-[#0F1A15] font-medium">
                D'émissions par rapport à un utilitaire
              </p>
            </motion.div>

            <motion.div
              whileHover={{ y: -5 }}
              className="bg-sky-100 p-8 rounded-[2rem] border-2 border-[#0F1A15] shadow-[4px_4px_0_#0F1A15] relative overflow-hidden group transition-all"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-sky-200 border border-[#0F1A15] rounded-2xl text-[#0F1A15]">
                  <Leaf className="w-6 h-6" />
                </div>
              </div>
              <p
                className="oversized-number mb-4 text-[#0F1A15]"
                style={{ fontSize: "64px" }}
              >
                Pure
              </p>
              <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#0F1A15]/60 mb-2">
                Qualité d'air
              </h4>
              <p className="text-sm text-[#0F1A15] font-medium">
                Zéro oxyde d'azote rejeté lors de chaque trajet
              </p>
            </motion.div>

            <motion.div
              whileHover={{ y: -5 }}
              className="bg-[#E04A26] p-8 rounded-[2rem] border-2 border-[#0F1A15] shadow-[4px_4px_0_#0F1A15] text-white relative overflow-hidden"
            >
              <div className="relative z-10 h-full flex flex-col">
                <div className="flex items-center gap-4 mb-auto">
                  <div className="p-3 bg-white/20 border border-[#0F1A15]/20 rounded-2xl text-white backdrop-blur-sm">
                    <Trophy className="w-6 h-6" />
                  </div>
                </div>
                <div className="mt-8">
                  <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/70 mb-2">
                    Angers 2025
                  </h4>
                  <p className="font-serif italic text-3xl leading-tight mb-3">
                    Ville de Demain
                  </p>
                  <p className="text-sm font-medium">
                    Lauréat de l'appel à projets "Mobilités Durables"
                  </p>
                </div>
              </div>
              <Bike className="absolute -top-4 -right-8 w-48 h-48 text-white/10 rotate-12" />
            </motion.div>
          </div>
        </section>

        {/* Filters & Discovery */}
        <div className="mb-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 border-b border-[#0F1A15]/10 pb-8">
            <div>
              <h3 className="text-2xl font-serif italic mb-2">
                Explorez les talents locaux
              </h3>
              <p className="text-sm text-[#0F1A15]/60">
                Sélectionnez une catégorie pour découvrir vos futurs
                partenaires.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                className={`px-6 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${
                  showFavoritesOnly
                    ? "bg-red-500 text-white shadow-lg shadow-red-500/20"
                    : "bg-white text-[#0F1A15]/60 hover:bg-[#0F1A15]/5 border border-[#0F1A15]/10"
                }`}
              >
                <Heart
                  className={`w-3.5 h-3.5 ${showFavoritesOnly ? "fill-current" : ""}`}
                />
                Mes Favoris
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 overflow-x-auto pb-6 scrollbar-hide px-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-8 py-3.5 rounded-full text-sm font-bold transition-all whitespace-nowrap shrink-0 flex items-center gap-3 ${
                  selectedCategory === cat
                    ? "bg-[#E04A26] text-[#F8F6F2] text-[#F8F6F2] neo-border neo-shadow -translate-y-1"
                    : "bg-white text-[#0F1A15] border-2 border-[#0F1A15]/10 hover:border-[#0F1A15] hover:-translate-y-1 hover:shadow-[2px_2px_0_#0F1A15]"
                }`}
              >
                {cat !== "Tous" && CATEGORY_ICONS[cat as Category]}
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Results Section */}
        {viewMode === "grid" ? (
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
                  className="group bg-[#FFFCF9] rounded-[2rem] overflow-hidden border-2 border-[#0F1A15] transition-all hover:-translate-y-2 hover:neo-shadow flex flex-col"
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
                          favorites.includes(pro.id)
                            ? "bg-red-500 text-white shadow-lg shadow-red-500/30"
                            : "bg-white/20 text-white hover:bg-white/40"
                        }`}
                      >
                        <Heart
                          className={`w-3.5 h-3.5 ${favorites.includes(pro.id) ? "fill-current" : ""}`}
                        />
                      </button>
                      {pro.co2Saved && (
                        <div className="absolute bottom-4 left-4 flex items-center gap-1.5 px-2 py-0.5 bg-white/90 backdrop-blur-md text-[#E04A26] rounded-md text-[9px] font-bold shadow-sm">
                          <Zap className="w-2.5 h-2.5" />-{pro.co2Saved}kg
                          CO2/an
                        </div>
                      )}
                    </div>
                  )}
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#F8F6F2] text-[#E04A26] rounded-full text-[11px] font-bold uppercase tracking-wider">
                          {CATEGORY_ICONS[pro.category]}
                          {pro.category}
                        </span>
                        {pro.stats?.yearsActive && (
                          <span className="text-[10px] text-[#0F1A15]/40 font-medium">
                            Depuis {pro.stats.yearsActive} ans
                          </span>
                        )}
                      </div>

                      <h3 className="text-xl font-bold mb-1 group-hover:text-[#E04A26] transition-colors">
                        {pro.name}
                      </h3>
                      <div className="flex flex-col gap-1 mb-3">
                        <div className="flex items-center gap-2">
                          <StarRating
                            rating={
                              pro.reviews?.reduce((acc, r) => acc + r.rating, 0)
                                ? pro.reviews?.reduce(
                                    (acc, r) => acc + r.rating,
                                    0,
                                  ) / (pro.reviews?.length || 1)
                                : 5
                            }
                          />
                          <span className="text-[10px] font-bold text-[#0F1A15]/40 uppercase tracking-tighter">
                            ({pro.reviews?.length || 0} avis)
                          </span>
                        </div>
                        {pro.siret && (
                          <span className="text-[9px] font-mono text-[#0F1A15]/30 uppercase">
                            SIRET: {pro.siret}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-[#0F1A15]/60 leading-relaxed mb-6 line-clamp-3">
                        {pro.description}
                      </p>

                      <div className="space-y-2.5 mb-6">
                        <div className="flex items-start gap-3 text-sm text-[#0F1A15]/70">
                          <MapPin className="w-4 h-4 mt-0.5 text-[#E04A26]" />
                          <span>{pro.location}</span>
                        </div>
                      </div>

                      {/* Profile & Reviews Section Toggle */}
                      <div className="mb-6 space-y-3">
                        <button
                          onClick={() => setSelectedPro(pro)}
                          className="flex items-center gap-2 text-xs font-bold text-[#0F1A15] uppercase tracking-wider hover:text-[#E04A26] transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Détails du profil
                        </button>

                        <button
                          onClick={() =>
                            setActiveReviewProId(
                              activeReviewProId === pro.id ? null : pro.id,
                            )
                          }
                          className="flex items-center gap-2 text-xs font-bold text-[#E04A26] uppercase tracking-wider hover:opacity-70 transition-opacity"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          {activeReviewProId === pro.id
                            ? "Masquer les avis"
                            : "Voir les avis"}
                        </button>

                        <AnimatePresence>
                          {activeReviewProId === pro.id && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden mt-4 pt-4 border-t border-[#0F1A15]/5"
                            >
                              {/* List Reviews */}
                              <div className="space-y-4 mb-6 max-h-48 overflow-y-auto pr-2 scrollbar-hide">
                                {pro.reviews?.map((rev) => (
                                  <div
                                    key={rev.id}
                                    className="bg-[#F8F6F2]/50 p-3 rounded-2xl"
                                  >
                                    <div className="flex justify-between items-center mb-1">
                                      <span className="text-xs font-bold">
                                        {rev.userName}
                                      </span>
                                      <span className="text-[10px] opacity-40">
                                        {rev.date}
                                      </span>
                                    </div>
                                    <StarRating rating={rev.rating} size={10} />
                                    <p className="text-xs text-[#0F1A15]/70 mt-1.5">
                                      {rev.comment}
                                    </p>
                                  </div>
                                ))}
                                {(!pro.reviews || pro.reviews.length === 0) && (
                                  <p className="text-xs text-[#0F1A15]/40 italic">
                                    Aucun avis pour le moment.
                                  </p>
                                )}
                              </div>

                              {/* Add Review Form */}
                              <div className="bg-[#0F1A15] p-4 rounded-2xl text-[#F8F6F2]">
                                <h4 className="text-[10px] font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                                  <Plus className="w-3 h-3" />
                                  Laisser un avis
                                </h4>
                                <div className="space-y-3">
                                  <input
                                    type="text"
                                    placeholder="Votre nom"
                                    className="w-full bg-[#F8F6F2]/10 border-none rounded-lg text-xs p-2 placeholder-[#F8F6F2]/30 focus:ring-1 focus:ring-[#E04A26]"
                                    value={newReview.userName}
                                    onChange={(e) =>
                                      setNewReview({
                                        ...newReview,
                                        userName: e.target.value,
                                      })
                                    }
                                  />
                                  <div className="flex items-center gap-2 px-1">
                                    <span className="text-[10px] opacity-50 uppercase font-bold">
                                      Note :
                                    </span>
                                    <div className="flex gap-1">
                                      {[1, 2, 3, 4, 5].map((s) => (
                                        <button
                                          key={s}
                                          onClick={() =>
                                            setNewReview({
                                              ...newReview,
                                              rating: s,
                                            })
                                          }
                                        >
                                          <Star
                                            size={14}
                                            className={`${s <= newReview.rating ? "fill-yellow-400 text-yellow-400" : "text-[#F8F6F2]/20"}`}
                                          />
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                  <textarea
                                    placeholder="Votre message..."
                                    className="w-full bg-[#F8F6F2]/10 border-none rounded-lg text-xs p-2 h-16 resize-none placeholder-[#F8F6F2]/30 focus:ring-1 focus:ring-[#E04A26]"
                                    value={newReview.comment}
                                    onChange={(e) =>
                                      setNewReview({
                                        ...newReview,
                                        comment: e.target.value,
                                      })
                                    }
                                  />
                                  <button
                                    onClick={() => handleAddReview(pro.id)}
                                    className="w-full py-2 bg-[#E04A26] hover:bg-[#6A6A50] text-[#F8F6F2] rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2"
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

                    <div className="flex flex-wrap gap-2 pt-6 border-t border-[#0F1A15]/5">
                      <div className="w-full flex items-center justify-between mb-2">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-[#0F1A15]/30 flex items-center gap-1">
                          <Share2 className="w-2.5 h-2.5" /> Partager
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => shareOnSocial("facebook", pro)}
                            className="p-1.5 hover:bg-[#1877F2]/10 text-[#0F1A15]/40 hover:text-[#1877F2] transition-colors rounded-lg"
                            title="Partager sur Facebook"
                          >
                            <Facebook className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => shareOnSocial("twitter", pro)}
                            className="p-1.5 hover:bg-[#1DA1F2]/10 text-[#0F1A15]/40 hover:text-[#1DA1F2] transition-colors rounded-lg"
                            title="Partager sur Twitter"
                          >
                            <Twitter className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => shareOnSocial("linkedin", pro)}
                            className="p-1.5 hover:bg-[#0A66C2]/10 text-[#0F1A15]/40 hover:text-[#0A66C2] transition-colors rounded-lg"
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
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-black text-white rounded-xl text-xs font-bold hover:bg-[#E04A26] transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Site
                        </a>
                      )}
                      {pro.contact.phone && (
                        <a
                          href={`tel:${pro.contact.phone}`}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#E04A26] text-white rounded-xl text-xs font-bold hover:bg-[#B83A1C] transition-colors"
                        >
                          <Phone className="w-3 h-3" />
                          Appeler
                        </a>
                      )}
                      {pro.contact.email && (
                        <a
                          href={`mailto:${pro.contact.email}`}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-[#0F1A15]/10 rounded-xl text-xs font-bold hover:bg-[#0F1A15] hover:text-white transition-all"
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
          <div className="h-[600px] w-full rounded-[2.5rem] overflow-hidden border border-[#0F1A15]/10 shadow-2xl relative">
            <MapContainer
              center={[47.471, -0.552]}
              zoom={14}
              style={{ height: "100%", width: "100%" }}
              className="z-0"
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              {filteredEntrepreneurs.map((pro) => (
                <Marker key={pro.id} position={pro.coordinates}>
                  <Popup>
                    <div className="p-2 min-w-[200px]">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="p-1.5 bg-[#E04A26] text-white rounded-lg scale-75">
                          {CATEGORY_ICONS[pro.category]}
                        </span>
                        <h3 className="font-bold text-sm m-0">{pro.name}</h3>
                      </div>
                      <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                        {pro.description}
                      </p>
                      <button
                        onClick={() => setSelectedPro(pro)}
                        className="w-full py-1.5 bg-[#0F1A15] text-white text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-[#E04A26] transition-colors"
                      >
                        Voir le profil
                      </button>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>

            {/* Custom Legend */}
            <div className="absolute bottom-6 left-6 bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-[#0F1A15]/10 shadow-xl z-[400] flex flex-col gap-2">
              <span className="text-[9px] font-bold uppercase tracking-widest text-[#0F1A15]/40 mb-1 leading-none">
                Artisans par zone
              </span>
              <div className="flex items-center gap-2 text-xs font-medium">
                <div className="w-2 h-2 rounded-full bg-[#E04A26]" />
                {filteredEntrepreneurs.length} professionnels trouvés
              </div>
            </div>
          </div>
        )}

        {/* Call to Action for Artisans */}
        <section className="mt-20 mb-20 bg-[#E04A26] text-white rounded-[2.5rem] p-8 md:p-16 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-md">
            <h3 className="text-3xl font-serif italic mb-4">
              Vous êtes un artisan à vélo ?
            </h3>
            <p className="text-white/70 mb-0">
              Rejoignez le premier réseau d'artisans cyclomobiles à Angers et
              boostez votre visibilité auprès des clients locaux.
            </p>
          </div>
          <button
            onClick={() => setIsRegistering(true)}
            className="px-8 py-4 bg-white text-[#0F1A15] rounded-full font-bold uppercase tracking-widest hover:bg-[#F8F6F2] transition-all shadow-xl shadow-black/10"
          >
            Créer mon profil artisan
          </button>
        </section>

        {filteredEntrepreneurs.length === 0 && (
          <div className="text-center py-20">
            <div className="inline-block p-4 bg-[#0F1A15]/5 rounded-full mb-4">
              <Search className="w-8 h-8 text-[#0F1A15]/20" />
            </div>
            <h3 className="text-lg font-medium text-[#0F1A15]/60">
              Aucun artisan trouvé
            </h3>
            <p className="text-sm text-[#0F1A15]/40 mt-1">
              Essayez d'ajuster vos filtres ou votre recherche.
            </p>
          </div>
        )}

        {/* Footer Info */}
        <footer className="mt-20 pt-12 border-t border-[#0F1A15]/10 grid grid-cols-1 md:grid-cols-3 gap-8 pb-12">
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest opacity-40">
              Pourquoi le vélo ?
            </h4>
            <ul className="space-y-2 text-sm text-[#0F1A15]/70 italic">
              <li>"Le vélo instaure une proximité qui rassure"</li>
              <li>"Gain de temps : pas de bouchons, pas de stationnement"</li>
              <li>"Coût annuel : 825€ contre 6872€ pour un utilitaire"</li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest opacity-40">
              L'étude ADEME
            </h4>
            <p className="text-sm text-[#0F1A15]/60 leading-relaxed">
              Selon l'Agence de transition écologique, le vélo cargo est l'outil
              idéal pour les circuits courts et les zones urbaines denses.
            </p>
          </div>
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest opacity-40">
              À propos
            </h4>
            <p className="text-sm text-[#0F1A15]/60 leading-relaxed">
              VéloPro Angers est inspiré par le dynamisme des artisans de la
              ville d'Angers et le collectif Sicle.
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}
