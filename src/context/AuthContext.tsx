import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as fbSignOut, 
  onAuthStateChanged,
  updateProfile,
  signInAnonymously
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase/config';

interface AuthContextType {
  user: User | null;
  isGuest: boolean;
  guestName: string;
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name?: string) => Promise<void>;
  continueAsGuest: (customName?: string) => void;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isGuest, setIsGuest] = useState<boolean>(() => {
    return localStorage.getItem('syncpulse_is_guest') === 'true';
  });
  const [guestName, setGuestName] = useState<string>(() => {
    return localStorage.getItem('syncpulse_guest_name') || `Convidado-${Math.floor(1000 + Math.random() * 9000)}`;
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        setIsGuest(false);
        localStorage.removeItem('syncpulse_is_guest');
      }
      setLoading(false);
    }, (err) => {
      console.warn('Auth state error:', err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
      setIsGuest(false);
      localStorage.removeItem('syncpulse_is_guest');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('auth/popup-closed-by-user')) {
        setError('Login cancelado. Você fechou a janela do Google.');
      } else if (msg.includes('auth/unauthorized-domain')) {
        setError('Domínio não autorizado no Firebase Console. Use o modo Convidado ou autorize o domínio no Firebase.');
      } else {
        setError(`Erro ao autenticar com Google: ${msg}`);
      }
      throw err;
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      setIsGuest(false);
      localStorage.removeItem('syncpulse_is_guest');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('auth/user-not-found') || msg.includes('auth/wrong-password') || msg.includes('auth/invalid-credential')) {
        setError('E-mail ou senha incorretos.');
      } else if (msg.includes('auth/operation-not-allowed')) {
        setError('O provedor de E-mail/Senha precisa ser ativado no Firebase Console (Authentication > Sign-in method).');
      } else {
        setError(`Erro no login: ${msg}`);
      }
      throw err;
    }
  };

  const signUpWithEmail = async (email: string, pass: string, name?: string) => {
    setError(null);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      if (name && cred.user) {
        await updateProfile(cred.user, { displayName: name });
      }
      setIsGuest(false);
      localStorage.removeItem('syncpulse_is_guest');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('auth/email-already-in-use')) {
        setError('Este e-mail já está em uso.');
      } else if (msg.includes('auth/weak-password')) {
        setError('A senha deve ter pelo menos 6 caracteres.');
      } else if (msg.includes('auth/operation-not-allowed')) {
        setError('O provedor de E-mail/Senha precisa ser ativado no Firebase Console (Authentication > Sign-in method).');
      } else {
        setError(`Erro ao criar conta: ${msg}`);
      }
      throw err;
    }
  };

  const continueAsGuest = (customName?: string) => {
    const finalName = customName?.trim() || guestName;
    setIsGuest(true);
    setGuestName(finalName);
    localStorage.setItem('syncpulse_is_guest', 'true');
    localStorage.setItem('syncpulse_guest_name', finalName);
    setError(null);
    if (!auth.currentUser) {
      signInAnonymously(auth).catch(() => {
        // Anonymous sign-in may be disabled in console; guest mode proceeds fine with session PIN
      });
    }
  };

  const logout = async () => {
    try {
      await fbSignOut(auth);
      setIsGuest(false);
      localStorage.removeItem('syncpulse_is_guest');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        isGuest,
        guestName,
        loading,
        error,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        continueAsGuest,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
