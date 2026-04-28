
import React, { useState } from 'react';
import { Mail, Briefcase, User, X, CheckCircle, AlertCircle } from 'lucide-react';
import { db, registerWithEmail, signInWithGoogle, auth, loginWithEmail } from '../firebase';
import { doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Entrepreneur } from '../types';

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
    category: 'Solaire',
    description: '',
    location: '',
    phone: '',
  });

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
        setError("L'authentification Google n'est pas activée dans Firebase. Veuillez l'activer dans la console Firebase (Authentication > Sign-in method).");
      } else if (err.code === 'auth/popup-blocked') {
        setError("Le popup a été bloqué. Cliquez sur le bouton ci-dessous pour ouvrir dans un nouvel onglet.");
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
      }
    } catch (err: any) {
      if (err.code === 'auth/operation-not-allowed') {
        setError("L'authentification Email/Mot de passe n'est pas activée dans Firebase. Veuillez l'activer.");
      } else {
        setError(err.message || 'Erreur lors de la connexion.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClaim = async () => {
    if (!matchingProfile || !currentUser) return;
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
    }
  };

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setIsLoading(true);
    try {
      const proId = Date.now().toString() + Math.random().toString(36).substr(2, 5);
      await setDoc(doc(db, 'entrepreneurs', proId), {
        id: proId,
        name: newProfile.name,
        category: newProfile.category,
        description: newProfile.description,
        location: newProfile.location,
        contact: {
          email: currentUser.email || '',
          phone: newProfile.phone,
          website: '',
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
    <div className={`fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-[#141414]/90 backdrop-blur-md`}>
      <div className="w-full max-w-md bg-[#F5F5F0] rounded-[2rem] p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-6 right-6 p-2 hover:bg-[#141414]/5 rounded-full z-10">
          <X className="w-5 h-5" />
        </button>
        
        {error && (
          <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-xl flex items-start gap-3 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>{error}</div>
          </div>
        )}

        {step === 'choice' && (
          <div className="text-center">
            <h2 className="text-2xl font-serif italic mb-6">Bienvenue !</h2>
            <div className="space-y-4">
              {matchingProfile && (
                <button 
                  onClick={() => setStep('claim')}
                  className="w-full py-4 bg-[#5A5A40] text-white rounded-xl font-bold uppercase tracking-widest hover:bg-[#4A4A30] transition-colors"
                >
                  Réclamer profil : {matchingProfile.name}
                </button>
              )}
              <button 
                onClick={() => setStep('create')}
                className={`w-full py-4 ${matchingProfile ? 'bg-white border border-[#5A5A40] text-[#5A5A40]' : 'bg-[#5A5A40] text-white'} rounded-xl font-bold uppercase tracking-widest hover:opacity-90 transition-colors`}
              >
                Créer un nouveau profil
              </button>
            </div>
          </div>
        )}
        
        {step === 'login' && !currentUser && (
          <div className="text-center">
            <h2 className="text-2xl font-serif italic mb-2">Espace Artisan</h2>
            <p className="text-sm text-[#141414]/60 mb-8">Connectez-vous pour réclamer ou créer votre profil.</p>
            
            <button 
              onClick={handleGoogleLogin} 
              className="w-full py-4 bg-white border border-[#141414]/10 rounded-xl font-bold uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-[#141414]/5 transition-colors mb-6 shadow-sm"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
              Continuer avec Google
            </button>

            <div className="relative flex py-2 items-center mb-6">
              <div className="flex-grow border-t border-[#141414]/10"></div>
              <span className="flex-shrink-0 mx-4 text-[#141414]/40 text-xs font-bold uppercase">Ou</span>
              <div className="flex-grow border-t border-[#141414]/10"></div>
            </div>

            <form onSubmit={handleEmailAuth} className="space-y-4">
              <input 
                type="email" 
                placeholder="Adresse email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-white border border-[#141414]/10 rounded-xl p-4 text-sm focus:ring-1 focus:ring-[#5A5A40] outline-none"
              />
              <input 
                type="password" 
                placeholder="Mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-white border border-[#141414]/10 rounded-xl p-4 text-sm focus:ring-1 focus:ring-[#5A5A40] outline-none"
              />
              <button 
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-[#5A5A40] text-white rounded-xl font-bold uppercase tracking-widest hover:bg-[#4A4A30] transition-colors disabled:opacity-50"
              >
                {isLoading ? "Chargement..." : (isLogin ? "Se connecter" : "S'inscrire")}
              </button>
            </form>

            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="mt-4 text-xs font-bold uppercase tracking-wider text-[#5A5A40]/80 hover:text-[#5A5A40]"
            >
              {isLogin ? "Pas encore de compte ? S'inscrire" : "Déjà un compte ? Se connecter"}
            </button>
          </div>
        )}
        
        {step === 'claim' && matchingProfile && (
          <div className="text-center">
            <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
            <h2 className="text-2xl font-serif italic mb-4">Profil trouvé !</h2>
            <p className="text-sm text-[#141414]/80 mb-6">Un profil correspondant à <strong>{currentUser?.email}</strong> a été trouvé : <strong>{matchingProfile.name}</strong>.</p>
            <p className="text-xs text-[#141414]/60 mb-8 italic">Réclamez ce profil pour pouvoir modifier vos informations et répondre aux avis.</p>
            <button 
              onClick={handleClaim} 
              className="w-full py-4 bg-[#5A5A40] text-white rounded-xl font-bold uppercase tracking-widest hover:bg-[#4A4A30] transition-colors"
            >
              Réclamer ce profil
            </button>
          </div>
        )}
        
        {step === 'create' && (
          <div>
            <div className="text-center mb-6">
              <Briefcase className="w-12 h-12 text-[#5A5A40] mx-auto mb-4" />
              <h2 className="text-2xl font-serif italic mb-2">Nouveau profil</h2>
              <p className="text-sm text-[#141414]/60">Créez votre profil artisan pour être visible.</p>
            </div>
            
            <form onSubmit={handleCreateProfile} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#141414]/40 mb-1 ml-1">Nom de l'entreprise</label>
                <input 
                  type="text" 
                  value={newProfile.name}
                  onChange={(e) => setNewProfile({...newProfile, name: e.target.value})}
                  required
                  className="w-full bg-white border border-[#141414]/10 rounded-xl p-3 text-sm focus:ring-1 focus:ring-[#5A5A40] outline-none"
                />
              </div>
              
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#141414]/40 mb-1 ml-1">Catégorie</label>
                <select 
                  value={newProfile.category}
                  onChange={(e) => setNewProfile({...newProfile, category: e.target.value})}
                  className="w-full bg-white border border-[#141414]/10 rounded-xl p-3 text-sm focus:ring-1 focus:ring-[#5A5A40] outline-none"
                >
                  <option value="Solaire">Solaire</option>
                  <option value="Isolation">Isolation</option>
                  <option value="Pompe à chaleur">Pompe à chaleur</option>
                  <option value="Chauffage bois">Chauffage bois</option>
                  <option value="Ventilation">Ventilation</option>
                  <option value="Rénovation globale">Rénovation globale</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#141414]/40 mb-1 ml-1">Ville ou Région</label>
                <input 
                  type="text" 
                  value={newProfile.location}
                  onChange={(e) => setNewProfile({...newProfile, location: e.target.value})}
                  required
                  className="w-full bg-white border border-[#141414]/10 rounded-xl p-3 text-sm focus:ring-1 focus:ring-[#5A5A40] outline-none"
                />
              </div>
              
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#141414]/40 mb-1 ml-1">Téléphone</label>
                <input 
                  type="tel" 
                  value={newProfile.phone}
                  onChange={(e) => setNewProfile({...newProfile, phone: e.target.value})}
                  className="w-full bg-white border border-[#141414]/10 rounded-xl p-3 text-sm focus:ring-1 focus:ring-[#5A5A40] outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#141414]/40 mb-1 ml-1">Description courte</label>
                <textarea 
                  value={newProfile.description}
                  onChange={(e) => setNewProfile({...newProfile, description: e.target.value})}
                  required
                  rows={3}
                  className="w-full bg-white border border-[#141414]/10 rounded-xl p-3 text-sm focus:ring-1 focus:ring-[#5A5A40] outline-none resize-none"
                />
              </div>

              <button 
                type="submit"
                disabled={isLoading}
                className="w-full py-4 mt-2 bg-[#5A5A40] text-white rounded-xl font-bold uppercase tracking-widest hover:bg-[#4A4A30] transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Création en cours...' : 'Créer mon profil'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

