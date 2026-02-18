// @ts-nocheck
/**
 * Patient Portal Login Page
 * Secure login for patients to access their health information
 */

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '@/lib/api';
import {
  Heart,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  ArrowRight,
  Shield
} from 'lucide-react';

export function PortalLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [requires2FA, setRequires2FA] = useState(false);
  const [totpCode, setTotpCode] = useState('');
  const [tempToken, setTempToken] = useState('');

  const loginMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/patient-portal/auth/login', {
        email,
        password,
      });
      return response.data;
    },
    onSuccess: (data: any) => {
      if (data.data?.requires2FA) {
        setRequires2FA(true);
        setTempToken(data.data.tempToken);
      } else if (data.data?.token) {
        localStorage.setItem('portalToken', data.data.token);
        navigate('/portal');
      }
    },
    onError: (error: any) => {
      setError(error.response?.data?.error?.message || 'Erreur de connexion');
    },
  });

  const verify2FAMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/patient-portal/auth/verify-2fa', {
        tempToken,
        totpCode,
      });
      return response.data;
    },
    onSuccess: (data: any) => {
      if (data.data?.token) {
        localStorage.setItem('portalToken', data.data.token);
        navigate('/portal');
      }
    },
    onError: (error: any) => {
      setError(error.response?.data?.error?.message || 'Code invalide');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (requires2FA) {
      verify2FAMutation.mutate();
    } else {
      loginMutation.mutate();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 mb-4">
            <Heart className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Portail Patient
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Accédez à vos informations de santé en toute sécurité
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          {!requires2FA ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Error Message */}
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Email Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Adresse email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="votre@email.com"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Mot de passe
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Forgot Password Link */}
              <div className="flex justify-end">
                <Link
                  to="/portal/forgot-password"
                  className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  Mot de passe oublié ?
                </Link>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loginMutation.isPending}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-indigo-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50"
              >
                {loginMutation.isPending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    Se connecter
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* 2FA Verification */
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="text-center mb-4">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-3">
                  <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Vérification en deux étapes
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Entrez le code de votre application d'authentification
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* TOTP Code */}
              <div>
                <input
                  type="text"
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="w-full text-center text-2xl tracking-widest py-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  maxLength={6}
                  autoFocus
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={verify2FAMutation.isPending || totpCode.length !== 6}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-indigo-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50"
              >
                {verify2FAMutation.isPending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  'Vérifier'
                )}
              </button>

              {/* Back Button */}
              <button
                type="button"
                onClick={() => {
                  setRequires2FA(false);
                  setTotpCode('');
                  setError('');
                }}
                className="w-full text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                Retour à la connexion
              </button>
            </form>
          )}
        </div>

        {/* Register Link */}
        <div className="text-center mt-6">
          <p className="text-gray-600 dark:text-gray-400">
            Pas encore de compte ?{' '}
            <Link
              to="/portal/register"
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium"
            >
              S'inscrire
            </Link>
          </p>
        </div>

        {/* Security Notice */}
        <div className="text-center mt-6">
          <div className="inline-flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <Shield className="h-4 w-4" />
            <span>Connexion sécurisée par cryptage SSL</span>
          </div>
        </div>
      </div>
    </div>
  );
}
