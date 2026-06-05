import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Coins, Lock, Eye, EyeOff, AlertCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LoginProps {
  onLogin: (token: string) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('Por favor ingresa la contraseña');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (data.success) {
        onLogin(data.token);
      } else {
        setError(data.message || 'Contraseña incorrecta');
      }
    } catch (err) {
      setError('Error de conexión con el servidor');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-yellow-900/10 via-background to-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-yellow-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/3 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        {/* Card */}
        <div className="border border-white/10 bg-black/60 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden">
          {/* Header with gold accent */}
          <div className="relative px-8 pt-10 pb-6 text-center">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />
            
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="size-16 rounded-full bg-gradient-to-br from-primary to-yellow-600 flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_rgba(212,175,55,0.3)]"
            >
              <Coins className="size-8 text-black" />
            </motion.div>

            <h1 className="text-2xl font-bold text-white tracking-tight">
              Casino Club <span className="text-primary">RV</span>
            </h1>
            <p className="text-sm text-zinc-400 mt-2 font-medium">
              Panel de Administración
            </p>
            <p className="text-xs text-zinc-600 mt-1">
              Ingresa tu contraseña para acceder al generador de calendarios
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-8 pb-10 space-y-5">
            {/* Error message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-start gap-2.5"
                >
                  <AlertCircle className="size-4 text-red-400 shrink-0 mt-0.5" />
                  <span className="text-xs text-red-300 font-medium">{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Password input */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
                Contraseña de Administrador
              </label>
              <div className="relative">
                <Lock className="size-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  placeholder="Ingresa la contraseña..."
                  className="w-full bg-black/50 border border-white/10 rounded-lg pl-10 pr-10 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all"
                  autoFocus
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {/* Submit button */}
            <Button
              type="submit"
              disabled={isLoading || !password.trim()}
              className="w-full bg-primary hover:bg-primary/90 text-black font-bold h-12 text-sm shadow-[0_4px_20px_rgba(212,175,55,0.4)] transition-all"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin size-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Verificando...
                </span>
              ) : (
                <span className="flex items-center gap-2 justify-center">
                  <Sparkles className="size-5" />
                  Acceder al Panel
                </span>
              )}
            </Button>

            {/* Footer hint */}
            <p className="text-center text-[10px] text-zinc-700 pt-2">
              Herramienta de gestión de contenido para Instagram
            </p>
          </form>
        </div>

        {/* Decorative chips */}
        <div className="flex justify-center gap-3 mt-6 opacity-20">
          {['♠', '♥', '♦', '♣'].map((suit, i) => (
            <motion.span
              key={suit}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              className="text-2xl text-primary"
            >
              {suit}
            </motion.span>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
