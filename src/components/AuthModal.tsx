import React, { useState } from 'react';
import { X, Mail, Lock, User, ArrowRight, ShieldCheck, Sparkles, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { 
    user, 
    signInWithGoogle, 
    signInWithEmail, 
    signUpWithEmail, 
    continueAsGuest,
    error, 
    clearError 
  } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup' | 'guest'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [guestInput, setGuestInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    clearError();
    try {
      if (mode === 'signin') {
        await signInWithEmail(email, password);
        onClose();
      } else if (mode === 'signup') {
        await signUpWithEmail(email, password, displayName);
        onClose();
      }
    } catch {
      // Error handled in AuthContext
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setSubmitting(true);
    clearError();
    try {
      await signInWithGoogle();
      onClose();
    } catch {
      // Error handled in AuthContext
    } finally {
      setSubmitting(false);
    }
  };

  const handleGuest = () => {
    continueAsGuest(guestInput || undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-slate-50">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {mode === 'signin' ? 'Acessar Conta' : mode === 'signup' ? 'Criar Nova Conta' : 'Entrar como Convidado'}
            </h2>
            <p className="text-xs text-slate-500">Sincronize seus aparelhos com segurança</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-semibold">{error}</p>
                <p className="text-[11px] text-red-600/80">
                  Você também pode usar o <strong>Modo Convidado</strong> para testar instantaneamente.
                </p>
              </div>
            </div>
          )}

          {/* Google Button */}
          {mode !== 'guest' && (
            <>
              <button
                type="button"
                onClick={handleGoogle}
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm transition-all shadow-xs disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continuar com o Google</span>
              </button>

              <div className="relative flex items-center justify-center">
                <div className="border-t border-slate-200 w-full" />
                <span className="bg-white px-2.5 text-[10px] uppercase tracking-wider text-slate-400 font-bold absolute">
                  ou via e-mail
                </span>
              </div>

              {/* Email Form */}
              <form onSubmit={handleSubmit} className="space-y-3">
                {mode === 'signup' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Seu Nome / Aparelho</label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Ex: PC Principal"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-cyan-600 transition-colors"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">E-mail</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu.email@exemplo.com"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-cyan-600 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Senha</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mínimo de 6 caracteres"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-cyan-600 transition-colors"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs sm:text-sm transition-all shadow-xs disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <span>{mode === 'signin' ? 'Entrar' : 'Cadastrar e Conectar'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </>
          )}

          {mode === 'guest' && (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-cyan-50 border border-cyan-200 text-xs text-cyan-800">
                O <strong>Modo Convidado</strong> permite conectar o PC e o celular instantaneamente com o código PIN, QR Code ou Cabo USB sem precisar de cadastro.
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nome do seu aparelho (opcional)</label>
                <input
                  type="text"
                  value={guestInput}
                  onChange={(e) => setGuestInput(e.target.value)}
                  placeholder="Ex: Meu Celular / Laptop"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-cyan-600 transition-colors"
                />
              </div>

              <button
                type="button"
                onClick={handleGuest}
                className="w-full py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs sm:text-sm shadow-xs flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-4 h-4 text-cyan-200" />
                <span>Iniciar Agora como Convidado</span>
              </button>
            </div>
          )}

          {/* Toggle modes */}
          <div className="pt-2 border-t border-slate-200 flex flex-col gap-1.5 text-xs text-center text-slate-500">
            {mode === 'signin' ? (
              <>
                <p>
                  Não tem uma conta?{' '}
                  <button
                    type="button"
                    onClick={() => { setMode('signup'); clearError(); }}
                    className="text-cyan-700 hover:underline font-bold"
                  >
                    Criar conta
                  </button>
                </p>
                <button
                  type="button"
                  onClick={() => { setMode('guest'); clearError(); }}
                  className="text-slate-600 hover:text-slate-900 font-semibold"
                >
                  ⚡ Ou continue no <strong>Modo Convidado</strong> sem cadastro
                </button>
              </>
            ) : mode === 'signup' ? (
              <>
                <p>
                  Já possui conta?{' '}
                  <button
                    type="button"
                    onClick={() => { setMode('signin'); clearError(); }}
                    className="text-cyan-700 hover:underline font-bold"
                  >
                    Fazer Login
                  </button>
                </p>
                <button
                  type="button"
                  onClick={() => { setMode('guest'); clearError(); }}
                  className="text-slate-600 hover:text-slate-900 font-semibold"
                >
                  ⚡ Ou continue no <strong>Modo Convidado</strong>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => { setMode('signin'); clearError(); }}
                className="text-cyan-700 hover:underline font-bold"
              >
                Voltar para Login
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
