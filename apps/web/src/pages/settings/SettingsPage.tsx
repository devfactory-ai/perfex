/**
 * Settings Page
 * Platform configuration settings: language, country, currency, timezone, theme
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage, Language } from '@/contexts/LanguageContext';
import { useTheme, themePresets, type ThemeMode } from '@/contexts/ThemeContext';

// Countries list (focus on main markets)
const countries = [
  { code: 'TN', name: 'Tunisie', flag: '🇹🇳' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'DZ', name: 'Algérie', flag: '🇩🇿' },
  { code: 'MA', name: 'Maroc', flag: '🇲🇦' },
  { code: 'LY', name: 'Libye', flag: '🇱🇾' },
  { code: 'EG', name: 'Égypte', flag: '🇪🇬' },
  { code: 'SA', name: 'Arabie Saoudite', flag: '🇸🇦' },
  { code: 'AE', name: 'Émirats Arabes Unis', flag: '🇦🇪' },
  { code: 'BE', name: 'Belgique', flag: '🇧🇪' },
  { code: 'CH', name: 'Suisse', flag: '🇨🇭' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'US', name: 'États-Unis', flag: '🇺🇸' },
  { code: 'GB', name: 'Royaume-Uni', flag: '🇬🇧' },
  { code: 'DE', name: 'Allemagne', flag: '🇩🇪' },
  { code: 'IT', name: 'Italie', flag: '🇮🇹' },
  { code: 'ES', name: 'Espagne', flag: '🇪🇸' },
];

// Currencies list
const currencies = [
  { code: 'TND', name: 'Dinar tunisien', symbol: 'د.ت' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'USD', name: 'Dollar américain', symbol: '$' },
  { code: 'GBP', name: 'Livre sterling', symbol: '£' },
  { code: 'MAD', name: 'Dirham marocain', symbol: 'د.م.' },
  { code: 'DZD', name: 'Dinar algérien', symbol: 'د.ج' },
  { code: 'EGP', name: 'Livre égyptienne', symbol: 'ج.م' },
  { code: 'SAR', name: 'Riyal saoudien', symbol: 'ر.س' },
  { code: 'AED', name: 'Dirham émirati', symbol: 'د.إ' },
  { code: 'CHF', name: 'Franc suisse', symbol: 'CHF' },
  { code: 'CAD', name: 'Dollar canadien', symbol: 'CA$' },
];

// Timezones list
const timezones = [
  { value: 'Africa/Tunis', label: '(UTC+01:00) Tunis' },
  { value: 'Europe/Paris', label: '(UTC+01:00) Paris' },
  { value: 'Africa/Algiers', label: '(UTC+01:00) Alger' },
  { value: 'Africa/Casablanca', label: '(UTC+01:00) Casablanca' },
  { value: 'Africa/Tripoli', label: '(UTC+02:00) Tripoli' },
  { value: 'Africa/Cairo', label: '(UTC+02:00) Le Caire' },
  { value: 'Asia/Riyadh', label: '(UTC+03:00) Riyad' },
  { value: 'Asia/Dubai', label: '(UTC+04:00) Dubaï' },
  { value: 'Europe/London', label: '(UTC+00:00) Londres' },
  { value: 'Europe/Berlin', label: '(UTC+01:00) Berlin' },
  { value: 'Europe/Rome', label: '(UTC+01:00) Rome' },
  { value: 'Europe/Madrid', label: '(UTC+01:00) Madrid' },
  { value: 'Europe/Zurich', label: '(UTC+01:00) Zurich' },
  { value: 'America/New_York', label: '(UTC-05:00) New York' },
  { value: 'America/Toronto', label: '(UTC-05:00) Toronto' },
  { value: 'America/Los_Angeles', label: '(UTC-08:00) Los Angeles' },
];

// Language flags
const languageFlags: Record<Language, string> = {
  fr: '🇫🇷',
  en: '🇬🇧',
  ar: '🇹🇳',
};

interface PlatformSettings {
  country: string;
  currency: string;
  timezone: string;
  dateFormat: string;
  numberFormat: string;
}

const dateFormats = [
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (31/12/2024)' },
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (12/31/2024)' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (2024-12-31)' },
  { value: 'DD.MM.YYYY', label: 'DD.MM.YYYY (31.12.2024)' },
];

const numberFormats = [
  { value: 'fr-FR', label: '1 234,56 (Français)' },
  { value: 'en-US', label: '1,234.56 (Anglais US)' },
  { value: 'en-GB', label: '1,234.56 (Anglais UK)' },
  { value: 'de-DE', label: '1.234,56 (Allemand)' },
  { value: 'ar-TN', label: '1.234,56 (Arabe)' },
];

export function SettingsPage() {
  const { language, setLanguage, t } = useLanguage();
  const { mode, setMode, preset, setPreset } = useTheme();
  const [settings, setSettings] = useState<PlatformSettings>(() => {
    const saved = localStorage.getItem('platformSettings');
    return saved ? JSON.parse(saved) : {
      country: 'TN',
      currency: 'TND',
      timezone: 'Africa/Tunis',
      dateFormat: 'DD/MM/YYYY',
      numberFormat: 'fr-FR',
    };
  });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    localStorage.setItem('platformSettings', JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  useEffect(() => {
    // Auto-save when settings change
    localStorage.setItem('platformSettings', JSON.stringify(settings));
  }, [settings]);

  const languages: Language[] = ['fr', 'en', 'ar'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">
          {t('common.settings')}
        </h1>
        <p className="text-muted-foreground">
          Configuration de la plateforme et préférences régionales
        </p>
      </div>

      {/* Theme Settings - Full Width */}
      <div className="bg-card rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
          </svg>
          Apparence et thème
        </h2>

        {/* Mode Selection */}
        <div className="mb-6">
          <p className="text-sm text-muted-foreground mb-3">Mode d'affichage</p>
          <div className="flex gap-3">
            {[
              { value: 'light' as ThemeMode, label: 'Clair', icon: '☀️' },
              { value: 'dark' as ThemeMode, label: 'Sombre', icon: '🌙' },
              { value: 'system' as ThemeMode, label: 'Système', icon: '💻' },
            ].map((modeOption) => (
              <button
                key={modeOption.value}
                onClick={() => setMode(modeOption.value)}
                className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  mode === modeOption.value
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <span className="text-2xl">{modeOption.icon}</span>
                <span className="text-sm font-medium">{modeOption.label}</span>
                {mode === modeOption.value && (
                  <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Theme Presets */}
        <div>
          <p className="text-sm text-muted-foreground mb-3">Style de couleurs</p>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {themePresets.map((themePreset) => (
              <button
                key={themePreset.id}
                onClick={() => setPreset(themePreset.id)}
                className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  preset === themePreset.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                {/* Color Preview */}
                <div className="flex gap-1">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: themePreset.preview.primary }}
                  />
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: themePreset.preview.secondary }}
                  />
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: themePreset.preview.accent }}
                  />
                </div>
                <span className="text-xs font-medium text-center">{themePreset.name}</span>
                {preset === themePreset.id && (
                  <div className="absolute top-1 right-1">
                    <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Thème actuel: <strong>{themePresets.find(t => t.id === preset)?.name}</strong> - {themePresets.find(t => t.id === preset)?.description}
          </p>
        </div>
      </div>

      {/* Settings Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Language Settings */}
        <div className="bg-card rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
            </svg>
            {t('common.language')}
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Choisissez la langue d'affichage de l'interface
          </p>
          <div className="grid grid-cols-3 gap-3">
            {languages.map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                  language === lang
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <span className="text-3xl">{languageFlags[lang]}</span>
                <span className="text-sm font-medium">{t(`languages.${lang}`)}</span>
                {language === lang && (
                  <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Country Settings */}
        <div className="bg-card rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Pays
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Sélectionnez votre pays pour les paramètres fiscaux et réglementaires
          </p>
          <select
            value={settings.country}
            onChange={(e) => setSettings({ ...settings, country: e.target.value })}
            className="w-full px-4 py-2 border border-input rounded-lg bg-background"
          >
            {countries.map((country) => (
              <option key={country.code} value={country.code}>
                {country.flag} {country.name}
              </option>
            ))}
          </select>
        </div>

        {/* Currency Settings */}
        <div className="bg-card rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <svg className="h-5 w-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Devise
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Devise principale pour les transactions et rapports
          </p>
          <select
            value={settings.currency}
            onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
            className="w-full px-4 py-2 border border-input rounded-lg bg-background"
          >
            {currencies.map((currency) => (
              <option key={currency.code} value={currency.code}>
                {currency.symbol} - {currency.name} ({currency.code})
              </option>
            ))}
          </select>
        </div>

        {/* Timezone Settings */}
        <div className="bg-card rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <svg className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Fuseau horaire
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Fuseau horaire pour l'affichage des dates et heures
          </p>
          <select
            value={settings.timezone}
            onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
            className="w-full px-4 py-2 border border-input rounded-lg bg-background"
          >
            {timezones.map((tz) => (
              <option key={tz.value} value={tz.value}>
                {tz.label}
              </option>
            ))}
          </select>
        </div>

        {/* Date Format Settings */}
        <div className="bg-card rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Format de date
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Format d'affichage des dates dans l'application
          </p>
          <select
            value={settings.dateFormat}
            onChange={(e) => setSettings({ ...settings, dateFormat: e.target.value })}
            className="w-full px-4 py-2 border border-input rounded-lg bg-background"
          >
            {dateFormats.map((format) => (
              <option key={format.value} value={format.value}>
                {format.label}
              </option>
            ))}
          </select>
        </div>

        {/* Number Format Settings */}
        <div className="bg-card rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <svg className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
            </svg>
            Format des nombres
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Format d'affichage des nombres et montants
          </p>
          <select
            value={settings.numberFormat}
            onChange={(e) => setSettings({ ...settings, numberFormat: e.target.value })}
            className="w-full px-4 py-2 border border-input rounded-lg bg-background"
          >
            {numberFormats.map((format) => (
              <option key={format.value} value={format.value}>
                {format.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Other Settings Links */}
      <div className="bg-card rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold mb-4">
          Autres paramètres
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link
            to="/settings/modules"
            className="flex items-center gap-3 p-4 rounded-lg border border-border hover:border-primary hover:bg-accent transition-colors"
          >
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium">Gestion des modules</h3>
              <p className="text-sm text-muted-foreground">Activer/désactiver les modules</p>
            </div>
          </Link>

          <Link
            to="/profile"
            className="flex items-center gap-3 p-4 rounded-lg border border-border hover:border-primary hover:bg-accent transition-colors"
          >
            <div className="p-2 bg-green-500/10 rounded-lg">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium">{t('profile.title')}</h3>
              <p className="text-sm text-muted-foreground">Gérer votre profil utilisateur</p>
            </div>
          </Link>

          <Link
            to="/integrations"
            className="flex items-center gap-3 p-4 rounded-lg border border-border hover:border-primary hover:bg-accent transition-colors"
          >
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium">Intégrations</h3>
              <p className="text-sm text-muted-foreground">Connecteurs et API externes</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className={`px-6 py-2 rounded-lg font-medium transition-all ${
            saved
              ? 'bg-green-600 text-white'
              : 'bg-primary text-primary-foreground hover:bg-primary/90'
          }`}
        >
          {saved ? (
            <span className="flex items-center gap-2">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Enregistré
            </span>
          ) : (
            t('common.save')
          )}
        </button>
      </div>
    </div>
  );
}
