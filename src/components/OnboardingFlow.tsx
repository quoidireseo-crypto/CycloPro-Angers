
import React, { useState } from 'react';
import { Mail, Briefcase, User, X, CheckCircle, AlertCircle, Plus, MapPin } from 'lucide-react';
import { db, registerWithEmail, signInWithGoogle, auth, loginWithEmail } from '../firebase';
import { doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Entrepreneur, Category } from '../types';

interface OnboardingFlowProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: any;
  entrepreneurs: Entrepreneur[];
}

export default function OnboardingFlow({ isOpen, onClose, currentUser, entrepreneurs }: OnboardingFlowProps) {
  const [step, setStep] = useState<'login' | 'choice' | 'claim' | 'create'>('login');
  const [matchingProfile, setMatchingProfile] = useState<Entrepreneur | null>(null);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Default values for new profile
  const [newProfile, setNewProfile] = useState({
    name: '',
    category: 'Livraison' as Category,
    siret: '',
    description: '',
    longDescription: '',
    location: '',
    phone: '',
    website: '',
    image: '',
    coordinates: [47.4710, -0.5520] as [number, number]
  });

  const categories: Category[] = ['Paysage', 'Plomberie', 'Menuiserie', 'Électricité', 'Livraison', 'Bâtiment', 'Réparation', 'Solidarité', 'Logistique'];

  React.useEffect(() => {
    if (currentUser) {
        // Check if user already owns a profile
        const userHasProfile = entrepreneurs.some(p => (p as any).ownerId === currentUser.uid);
        
        if (userHasProfile) {
            // User already has a profile, close the onboarding
            onClose();
            return;
        }

        const match = entrepreneurs.find(p => (p as any).contact?.email === currentUser.email && !(p as any).ownerId);
        if (match) {
            setMatchingProfile(match);
        }
        setStep('choice');
    } else {
        setStep('login');
    }
  }, [currentUser, entrepreneurs, onClose]);

  const handleGoogleLogin = async () => {
    setError(null);
    try {
      if (window.self !== window.top) {
        window.open(window.location.href, '_blank');
        return;
      }
      await signInWithGoogle();
    } catch (err: any) {
      if (err.code === 'auth/operation-not-allowed') {
        setError("L'authentification Google n'est pas activée dans Firebase. Veuillez l'activer.");
      } else if (err.code === 'auth/popup-blocked') {
        setError("Le popup a été bloqué.");
      } else {
        setError(err.message || 'Erreur lors de la connexion.');
      }
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      if (isLogin) {
        await loginWithEmail(email, password);
      } else {
        await registerWithEmail(email, password);
        // After registration, the useEffect will trigger 'choice' step
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'authentification.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClaim = async () => {
    if (!matchingProfile || !currentUser) return;
    setIsLoading(true);
    try {
      await updateDoc(doc(db, 'entrepreneurs', matchingProfile.id), {
        ownerId: currentUser.uid,
        updatedAt: serverTimestamp()
      });
      alert('Profil réclamé avec succès !');
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(`Erreur lors de la réclamation du profil: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    
    if (!newProfile.name.trim() || !newProfile.description.trim() || !newProfile.location.trim()) {
      setError("Veuillez remplir tous les champs obligatoires (*)");
      return;
    }

    setIsLoading(true);
    try {
      const proId = Date.now().toString();
      await setDoc(doc(db, 'entrepreneurs', proId), {
        id: proId,
        name: newProfile.name,
        category: newProfile.category,
        siret: newProfile.siret,
        description: newProfile.description,
        longDescription: newProfile.longDescription,
        location: newProfile.location,
        coordinates: newProfile.coordinates,
        image: newProfile.image || "https://images.unsplash.com/photo-1590674154471-1678ee20a1ad?q=80&w=800&auto=format&fit=crop",
        co2Saved: 0,
        contact: {
          email: currentUser.email || '',
          phone: newProfile.phone,
          website: newProfile.website,
        },
        reviews: [],
        ownerId: currentUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      alert('Profil créé avec succès !');
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(`Erreur lors de la création du profil: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-[#0F1A15]/90 backdrop-blur-md`}>
      <div className={`w-full ${step === 'create' ? 'max-w-2xl' : 'max-w-md'} bg-[#F8F6F2] rounded-[2rem] p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto`}>
        <button onClick={onClose} className="absolute top-6 right-6 p-2 hover:bg-[#0F1A15]/5 rounded-full z-10 transition-colors">
          <X className="w-5 h-5" />
        </button>
        
        {error && (
          <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-xl flex items-start gap-3 text-sm border border-red-200">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>{error}</div>
          </div>
        )}

        {step === 'choice' && (
          <div className="text-center py-4">
            <h2 className="text-3xl font-serif italic mb-2">Bienvenue !</h2>
            <p className="text-sm text-[#0F1A15]/60 mb-8">Votre compte est prêt. Comment souhaitez-vous continuer ?</p>
            <div className="space-y-4">
              {matchingProfile && (
                <button 
                  onClick={() => setStep('claim')}
                  className="w-full group p-6 bg-white border border-[#E04A26]/20 rounded-2xl text-left hover:border-[#E04A26] transition-all hover:shadow-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                      <CheckCircle className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-[#0F1A15]">Réclamer un profil existant</h3>
                      <p className="text-xs text-[#0F1A15]/50 mt-1">Nous avons trouvé un profil : <strong>{matchingProfile.name}</strong></p>
                    </div>
                  </div>
                </button>
              )}
              <button 
                onClick={() => setStep('create')}
                className="w-full group p-6 bg-white border border-[#E04A26]/20 rounded-2xl text-left hover:border-[#E04A26] transition-all hover:shadow-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-[#E04A26]/10 text-[#E04A26] rounded-xl">
                    <Plus className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#0F1A15]">Créer un nouveau profil</h3>
                    <p className="text-xs text-[#0F1A15]/50 mt-1">Configurez votre fiche artisan complète de A à Z.</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}
        
        {step === 'login' && !currentUser && (
          <div className="text-center">
            <h2 className="text-3xl font-serif italic mb-2">{isLogin ? "Espace Artisan" : "Inscription Artisan"}</h2>
            <p className="text-sm text-[#0F1A15]/60 mb-8">Connectez-vous pour gérer votre présence sur Angers.</p>
            
            <button 
              onClick={handleGoogleLogin} 
              className="w-full py-4 bg-white border border-[#0F1A15]/10 rounded-xl font-bold uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-[#0F1A15]/5 transition-all mb-6 shadow-sm"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
              Continuer avec Google
            </button>

            <div className="relative flex py-2 items-center mb-6">
              <div className="flex-grow border-t border-[#0F1A15]/10"></div>
              <span className="flex-shrink-0 mx-4 text-[#0F1A15]/40 text-[10px] font-bold uppercase tracking-widest">Ou avec un email</span>
              <div className="flex-grow border-t border-[#0F1A15]/10"></div>
            </div>

            <form onSubmit={handleEmailAuth} className="space-y-4">
              <input 
                type="email" 
                placeholder="Adresse email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-white border border-[#0F1A15]/10 rounded-xl p-4 text-sm focus:ring-1 focus:ring-[#E04A26] outline-none"
              />
              <input 
                type="password" 
                placeholder="Mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-white border border-[#0F1A15]/10 rounded-xl p-4 text-sm focus:ring-1 focus:ring-[#E04A26] outline-none"
              />
              <button 
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-[#E04A26] text-white rounded-xl font-bold uppercase tracking-widest hover:bg-[#B83A1C] transition-all disabled:opacity-50 shadow-xl shadow-[#E04A26]/20"
              >
                {isLoading ? "Chargement..." : (isLogin ? "Se connecter" : "S'inscrire")}
              </button>
            </form>

            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="mt-6 text-[10px] font-bold uppercase tracking-wider text-[#E04A26]/80 hover:text-[#E04A26] transition-colors underline decoration-dotted"
            >
              {isLogin ? "Pas encore de compte ? Créer un profil" : "Déjà un compte ? Se connecter"}
            </button>
          </div>
        )}
        
        {step === 'claim' && matchingProfile && (
          <div className="text-center py-6">
            <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10" />
            </div>
            <h2 className="text-3xl font-serif italic mb-4">Profil trouvé !</h2>
            <div className="bg-white p-6 rounded-2xl border border-[#0F1A15]/5 mb-8 text-left">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#0F1A15]/40 mb-1">Entreprise</p>
              <h3 className="text-xl font-bold mb-2">{matchingProfile.name}</h3>
              <p className="text-xs text-[#0F1A15]/60 mb-4">{matchingProfile.description}</p>
              <div className="flex items-center gap-2 text-xs text-[#E04A26] font-medium">
                <MapPin className="w-3 h-3" />
                {matchingProfile.location}
              </div>
            </div>
            <p className="text-sm text-[#0F1A15]/60 mb-8 px-4">Réclamez ce profil pour prendre le contrôle sur vos informations et répondre aux avis de vos clients.</p>
            <button 
              onClick={handleClaim} 
              disabled={isLoading}
              className="w-full py-4 bg-[#E04A26] text-white rounded-xl font-bold uppercase tracking-widest hover:bg-[#B83A1C] transition-all shadow-xl shadow-[#E04A26]/20 flex items-center justify-center gap-2"
            >
              {isLoading ? "Traitement..." : "Confirmer la réclamation"}
            </button>
            <button 
              onClick={() => setStep('choice')}
              className="mt-4 text-[10px] font-bold uppercase tracking-widest text-[#0F1A15]/40 hover:text-[#0F1A15]"
            >
              Retour
            </button>
          </div>
        )}
        
        {step === 'create' && (
          <div>
            <div className="text-center mb-10">
              <div className="w-16 h-16 bg-[#E04A26]/10 text-[#E04A26] rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Briefcase className="w-8 h-8" />
              </div>
              <h2 className="text-3xl font-serif italic mb-2">Votre Profil Artisan</h2>
              <p className="text-sm text-[#0F1A15]/60">Offrez une visibilité maximale à votre activité décarbonée.</p>
            </div>
            
            <form onSubmit={handleCreateProfile} className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[#0F1A15]/40 mb-1.5 ml-1">Nom de l'entreprise *</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Angers Cyclo Plomberie"
                    value={newProfile.name}
                    onChange={(e) => setNewProfile({...newProfile, name: e.target.value})}
                    required
                    className="w-full bg-white border border-[#0F1A15]/10 rounded-xl p-3 text-sm focus:ring-1 focus:ring-[#E04A26] outline-none transition-all"
                  />
                </div>
                
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[#0F1A15]/40 mb-1.5 ml-1">Catégorie *</label>
                  <select 
                    value={newProfile.category}
                    onChange={(e) => setNewProfile({...newProfile, category: e.target.value as Category})}
                    className="w-full bg-white border border-[#0F1A15]/10 rounded-xl p-3 text-sm focus:ring-1 focus:ring-[#E04A26] outline-none transition-all appearance-none"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[#0F1A15]/40 mb-1.5 ml-1">SIRET</label>
                  <input 
                    type="text" 
                    placeholder="14 chiffres"
                    value={newProfile.siret}
                    onChange={(e) => setNewProfile({...newProfile, siret: e.target.value})}
                    className="w-full bg-white border border-[#0F1A15]/10 rounded-xl p-3 text-sm focus:ring-1 focus:ring-[#E04A26] outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[#0F1A15]/40 mb-1.5 ml-1">Ville ou Secteur *</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Quartier Doutre, Belle-Beille..."
                    value={newProfile.location}
                    onChange={(e) => setNewProfile({...newProfile, location: e.target.value})}
                    required
                    className="w-full bg-white border border-[#0F1A15]/10 rounded-xl p-3 text-sm focus:ring-1 focus:ring-[#E04A26] outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[#0F1A15]/40 mb-1.5 ml-1">Téléphone</label>
                  <input 
                    type="tel" 
                    placeholder="06 XX XX XX XX"
                    value={newProfile.phone}
                    onChange={(e) => setNewProfile({...newProfile, phone: e.target.value})}
                    className="w-full bg-white border border-[#0F1A15]/10 rounded-xl p-3 text-sm focus:ring-1 focus:ring-[#E04A26] outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[#0F1A15]/40 mb-1.5 ml-1">Site Web</label>
                  <input 
                    type="url" 
                    placeholder="https://votre-site.fr"
                    value={newProfile.website}
                    onChange={(e) => setNewProfile({...newProfile, website: e.target.value})}
                    className="w-full bg-white border border-[#0F1A15]/10 rounded-xl p-3 text-sm focus:ring-1 focus:ring-[#E04A26] outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[#0F1A15]/40 mb-1.5 ml-1">URL Image (Optionnel)</label>
                  <input 
                    type="url" 
                    placeholder="https://image-de-votre-activite.jpg"
                    value={newProfile.image}
                    onChange={(e) => setNewProfile({...newProfile, image: e.target.value})}
                    className="w-full bg-white border border-[#0F1A15]/10 rounded-xl p-3 text-sm focus:ring-1 focus:ring-[#E04A26] outline-none transition-all"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#0F1A15]/40 mb-1.5 ml-1">Description courte *</label>
                <textarea 
                  placeholder="Accroche publicitaire en une phrase..."
                  value={newProfile.description}
                  onChange={(e) => setNewProfile({...newProfile, description: e.target.value})}
                  required
                  rows={2}
                  className="w-full bg-white border border-[#0F1A15]/10 rounded-xl p-3 text-sm focus:ring-1 focus:ring-[#E04A26] outline-none resize-none transition-all"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#0F1A15]/40 mb-1.5 ml-1">Description détaillée (Story-telling)</label>
                <textarea 
                  placeholder="Détaillez vos services, votre équipement, vos valeurs..."
                  value={newProfile.longDescription}
                  onChange={(e) => setNewProfile({...newProfile, longDescription: e.target.value})}
                  rows={4}
                  className="w-full bg-white border border-[#0F1A15]/10 rounded-xl p-3 text-sm focus:ring-1 focus:ring-[#E04A26] outline-none resize-none transition-all"
                />
              </div>

              <div className="md:col-span-2 pt-4">
                <button 
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 bg-[#E04A26] text-white rounded-2xl font-bold uppercase tracking-widest hover:bg-[#B83A1C] transition-all disabled:opacity-50 shadow-xl shadow-[#E04A26]/20 flex items-center justify-center gap-3"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      <span>Création de votre fiche...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5" />
                      Publier mon profil artisan
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

