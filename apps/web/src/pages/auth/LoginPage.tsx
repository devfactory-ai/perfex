/**
 * Login Page - Perfex Bakery Edition
 */

import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginInput } from '@perfex/shared';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { Eye, EyeOff, Mail, Lock, Croissant, Package, Truck, ChefHat, User } from 'lucide-react';

// Demo accounts for bakery
const DEMO_ACCOUNTS = [
  { role: 'Gérant', email: 'demo@perfex.io', password: 'Demo@2024!', icon: ChefHat, color: 'amber' },
  { role: 'Boulanger', email: 'boulanger@perfex.io', password: 'Baker@2024!', icon: Croissant, color: 'orange' },
  { role: 'Vendeur', email: 'vente@perfex.io', password: 'Sales@2024!', icon: User, color: 'blue' },
  { role: 'Livreur', email: 'livraison@perfex.io', password: 'Delivery@2024!', icon: Truck, color: 'green' },
];

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, error, clearError } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordless, setShowPasswordless] = useState(false);
  const [passwordlessEmail, setPasswordlessEmail] = useState('');
  const [passwordlessStatus, setPasswordlessStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [passwordlessError, setPasswordlessError] = useState('');

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    try {
      setIsSubmitting(true);
      clearError();
      await login(data);
      navigate(from, { replace: true });
    } catch (err) {
      setIsSubmitting(false);
    }
  };

  const handlePasswordlessLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!passwordlessEmail) {
      setPasswordlessError('Veuillez entrer votre email');
      return;
    }

    try {
      setPasswordlessStatus('sending');
      setPasswordlessError('');
      await api.post('/auth/passwordless/request', { email: passwordlessEmail });
      setPasswordlessStatus('sent');
    } catch (error: any) {
      setPasswordlessStatus('error');
      setPasswordlessError(
        error.response?.data?.error?.message || 'Échec de l\'envoi du lien'
      );
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Side - Bakery Illustration */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-amber-500 via-orange-600 to-amber-700 relative overflow-hidden">
        {/* Background Pattern - Wheat */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="wheat" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="10" cy="10" r="2" fill="white" />
                <path d="M 10 0 Q 15 5 10 10 Q 5 5 10 0" fill="none" stroke="white" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#wheat)" />
          </svg>
        </div>

        {/* Floating Shapes */}
        <div className="absolute top-20 left-20 w-32 h-32 bg-white/10 rounded-full blur-xl animate-pulse" />
        <div className="absolute bottom-40 right-20 w-48 h-48 bg-amber-300/20 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-10 w-24 h-24 bg-orange-400/20 rounded-full blur-xl animate-pulse" style={{ animationDelay: '2s' }} />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
          {/* Logo */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-lg">
                <Croissant className="w-8 h-8 text-amber-600" />
              </div>
              <div>
                <span className="text-3xl font-bold text-white">Perfex Bakery</span>
                <p className="text-amber-200 text-sm">Boulangerie-Pâtisserie ERP</p>
              </div>
            </div>
            <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-4">
              Gérez votre boulangerie
              <br />
              <span className="text-amber-200">du fournil à la vente</span>
            </h1>
            <p className="text-lg text-amber-100/80 max-w-md">
              Solution complète pour la gestion des stocks, production, maintenance,
              livraisons B2B et ventes sur place.
            </p>
          </div>

          {/* Features */}
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Gestion des stocks</h3>
                <p className="text-amber-200/70 text-sm">Matières premières et alertes automatiques</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <ChefHat className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Suivi de production</h3>
                <p className="text-amber-200/70 text-sm">Chambres de pousse, fours et qualité</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <Truck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Livraisons B2B</h3>
                <p className="text-amber-200/70 text-sm">Bons de livraison avec signature</p>
              </div>
            </div>
          </div>

          {/* Bakery Preview */}
          <div className="mt-12 relative">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 shadow-2xl border border-white/20">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <span className="text-xs text-white/60">Boulangerie Au Pain Doré</span>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-white/80 text-sm">Production du jour</span>
                  <span className="text-amber-200 font-semibold">342 produits</span>
                </div>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="bg-white/10 rounded-lg p-2">
                    <div className="text-2xl">🥖</div>
                    <div className="text-xs text-white/70">Pains</div>
                    <div className="text-white font-bold">156</div>
                  </div>
                  <div className="bg-white/10 rounded-lg p-2">
                    <div className="text-2xl">🥐</div>
                    <div className="text-xs text-white/70">Viennois.</div>
                    <div className="text-white font-bold">98</div>
                  </div>
                  <div className="bg-white/10 rounded-lg p-2">
                    <div className="text-2xl">🍰</div>
                    <div className="text-xs text-white/70">Pâtiss.</div>
                    <div className="text-white font-bold">64</div>
                  </div>
                  <div className="bg-white/10 rounded-lg p-2">
                    <div className="text-2xl">🥪</div>
                    <div className="text-xs text-white/70">Snacks</div>
                    <div className="text-white font-bold">24</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50 dark:bg-gray-900">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden mb-8 text-center">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-amber-600 rounded-xl flex items-center justify-center">
                <Croissant className="w-6 h-6 text-white" />
              </div>
              <div className="text-left">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">Perfex Bakery</span>
                <p className="text-xs text-gray-500">Boulangerie ERP</p>
              </div>
            </div>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Bienvenue 👋
            </h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Connectez-vous pour accéder à votre espace
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Adresse email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('email')}
                  id="email"
                  type="email"
                  autoComplete="email"
                  className="block w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-shadow"
                  placeholder="vous@exemple.com"
                />
              </div>
              {errors.email && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.email.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('password')}
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className="block w-full pl-12 pr-12 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-shadow"
                  placeholder="Entrez votre mot de passe"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.password.message}</p>
              )}
            </div>

            {/* Remember me & Forgot password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                />
                <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Se souvenir de moi</span>
              </label>
              <Link
                to="/forgot-password"
                className="text-sm font-medium text-amber-600 hover:text-amber-500 dark:text-amber-400"
              >
                Mot de passe oublié ?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white font-semibold rounded-xl shadow-lg shadow-amber-600/30 hover:shadow-amber-600/40 transition-all disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Connexion en cours...
                </span>
              ) : (
                'Se connecter'
              )}
            </button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-gray-700" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-gray-50 dark:bg-gray-900 text-gray-500">ou</span>
              </div>
            </div>

            {/* Passwordless Login */}
            <button
              type="button"
              onClick={() => setShowPasswordless(!showPasswordless)}
              className="w-full py-3 px-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
            >
              <Mail className="w-5 h-5" />
              {showPasswordless ? 'Utiliser un mot de passe' : 'Connexion par lien magique'}
            </button>
          </form>

          {/* Passwordless Form */}
          {showPasswordless && (
            <div className="mt-6 rounded-xl bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Connexion sans mot de passe
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Entrez votre email et nous vous enverrons un lien de connexion instantanée.
              </p>

              {passwordlessStatus === 'sent' ? (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-sm text-green-800 dark:text-green-200">
                      Vérifiez votre boîte mail ! Nous avons envoyé un lien à <strong>{passwordlessEmail}</strong>
                    </p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handlePasswordlessLogin} className="space-y-4">
                  {passwordlessError && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                      <p className="text-sm text-red-800">{passwordlessError}</p>
                    </div>
                  )}

                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      value={passwordlessEmail}
                      onChange={(e) => setPasswordlessEmail(e.target.value)}
                      placeholder="vous@exemple.com"
                      className="block w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={passwordlessStatus === 'sending'}
                    className="w-full py-3 px-4 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white font-semibold rounded-xl transition-colors"
                  >
                    {passwordlessStatus === 'sending' ? 'Envoi en cours...' : 'Envoyer le lien magique'}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Demo Credentials - All Roles */}
          <div className="mt-6 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4">
            <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-200 mb-3 flex items-center gap-2">
              <Croissant className="w-4 h-4" />
              Comptes de démonstration - Boulangerie Au Pain Doré
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map((account) => {
                const IconComponent = account.icon;
                return (
                  <button
                    key={account.email}
                    type="button"
                    onClick={() => {
                      setValue('email', account.email);
                      setValue('password', account.password);
                    }}
                    className={`flex items-center gap-2 p-2 rounded-lg border transition-all hover:scale-[1.02] ${
                      account.color === 'amber'
                        ? 'bg-amber-100 dark:bg-amber-900/40 border-amber-300 dark:border-amber-700 hover:bg-amber-200 dark:hover:bg-amber-800/40'
                        : account.color === 'orange'
                        ? 'bg-orange-100 dark:bg-orange-900/40 border-orange-300 dark:border-orange-700 hover:bg-orange-200 dark:hover:bg-orange-800/40'
                        : account.color === 'blue'
                        ? 'bg-blue-100 dark:bg-blue-900/40 border-blue-300 dark:border-blue-700 hover:bg-blue-200 dark:hover:bg-blue-800/40'
                        : 'bg-green-100 dark:bg-green-900/40 border-green-300 dark:border-green-700 hover:bg-green-200 dark:hover:bg-green-800/40'
                    }`}
                  >
                    <IconComponent className={`w-5 h-5 ${
                      account.color === 'amber' ? 'text-amber-600'
                      : account.color === 'orange' ? 'text-orange-600'
                      : account.color === 'blue' ? 'text-blue-600'
                      : 'text-green-600'
                    }`} />
                    <div className="text-left">
                      <div className="text-xs font-semibold text-gray-800 dark:text-gray-200">{account.role}</div>
                      <div className="text-[10px] text-gray-500 dark:text-gray-400 truncate max-w-[100px]">{account.email}</div>
                    </div>
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-[10px] text-amber-600 dark:text-amber-400 text-center">
              Cliquez sur un rôle pour remplir automatiquement
            </p>
          </div>

          {/* Register Link */}
          <p className="mt-8 text-center text-gray-600 dark:text-gray-400">
            Pas encore de compte ?{' '}
            <Link to="/register" className="font-semibold text-amber-600 hover:text-amber-500">
              Créer un compte
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
