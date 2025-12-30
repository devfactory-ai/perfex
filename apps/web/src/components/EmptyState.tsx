/**
 * Empty State Component
 * Shows when there's no data to display with beautiful illustrations
 */

import { ReactNode } from 'react';

const EmptyStateIllustrations = {
  inbox: (
    <svg className="mx-auto w-48 h-48" viewBox="0 0 200 200" fill="none">
      <circle cx="100" cy="100" r="80" fill="#EEF2FF" />
      <rect x="50" y="60" width="100" height="80" rx="8" fill="white" stroke="#C7D2FE" strokeWidth="2" />
      <path d="M50 100 L100 130 L150 100" stroke="#818CF8" strokeWidth="2" fill="none" />
      <path d="M50 68 L100 98 L150 68" stroke="#A5B4FC" strokeWidth="2" fill="none" />
      <circle cx="100" cy="45" r="15" fill="#818CF8" />
      <path d="M95 45 L100 50 L110 40" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  search: (
    <svg className="mx-auto w-48 h-48" viewBox="0 0 200 200" fill="none">
      <circle cx="100" cy="100" r="80" fill="#FEF3C7" />
      <circle cx="90" cy="90" r="35" stroke="#F59E0B" strokeWidth="4" fill="white" />
      <line x1="115" y1="115" x2="145" y2="145" stroke="#F59E0B" strokeWidth="4" strokeLinecap="round" />
      <circle cx="90" cy="90" r="20" fill="#FEF3C7" />
      <path d="M80 85 Q90 75 100 85" stroke="#F59E0B" strokeWidth="2" fill="none" />
      <circle cx="82" cy="90" r="3" fill="#F59E0B" />
      <circle cx="98" cy="90" r="3" fill="#F59E0B" />
    </svg>
  ),
  users: (
    <svg className="mx-auto w-48 h-48" viewBox="0 0 200 200" fill="none">
      <circle cx="100" cy="100" r="80" fill="#ECFDF5" />
      <circle cx="100" cy="75" r="25" fill="#10B981" />
      <path d="M60 140 Q100 110 140 140" fill="#10B981" />
      <circle cx="60" cy="85" r="18" fill="#34D399" />
      <path d="M30 130 Q60 105 90 130" fill="#34D399" />
      <circle cx="140" cy="85" r="18" fill="#34D399" />
      <path d="M110 130 Q140 105 170 130" fill="#34D399" />
      <circle cx="100" cy="70" r="8" fill="white" />
      <path d="M95 72 L100 78 L108 68" stroke="#10B981" strokeWidth="2" />
    </svg>
  ),
  document: (
    <svg className="mx-auto w-48 h-48" viewBox="0 0 200 200" fill="none">
      <circle cx="100" cy="100" r="80" fill="#EFF6FF" />
      <rect x="60" y="40" width="80" height="110" rx="6" fill="white" stroke="#93C5FD" strokeWidth="2" />
      <path d="M60 40 L60 46 L140 46 L140 40 L130 40 L130 34 L70 34 L70 40 Z" fill="#3B82F6" />
      <line x1="75" y1="65" x2="125" y2="65" stroke="#BFDBFE" strokeWidth="3" strokeLinecap="round" />
      <line x1="75" y1="80" x2="115" y2="80" stroke="#BFDBFE" strokeWidth="3" strokeLinecap="round" />
      <line x1="75" y1="95" x2="120" y2="95" stroke="#BFDBFE" strokeWidth="3" strokeLinecap="round" />
      <line x1="75" y1="110" x2="100" y2="110" stroke="#BFDBFE" strokeWidth="3" strokeLinecap="round" />
      <circle cx="130" cy="130" r="20" fill="#3B82F6" />
      <path d="M125 130 L129 134 L138 125" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  chart: (
    <svg className="mx-auto w-48 h-48" viewBox="0 0 200 200" fill="none">
      <circle cx="100" cy="100" r="80" fill="#FDF4FF" />
      <rect x="45" y="130" width="25" height="40" rx="4" fill="#C084FC" />
      <rect x="80" y="100" width="25" height="70" rx="4" fill="#A855F7" />
      <rect x="115" y="70" width="25" height="100" rx="4" fill="#9333EA" />
      <path d="M40 50 L57 80 L92 65 L127 40 L160 55" stroke="#7C3AED" strokeWidth="3" fill="none" strokeLinecap="round" />
      <circle cx="57" cy="80" r="5" fill="#7C3AED" />
      <circle cx="92" cy="65" r="5" fill="#7C3AED" />
      <circle cx="127" cy="40" r="5" fill="#7C3AED" />
      <circle cx="160" cy="55" r="8" fill="#7C3AED" />
      <path d="M156 55 L159 58 L165 52" stroke="white" strokeWidth="2" />
    </svg>
  ),
  box: (
    <svg className="mx-auto w-48 h-48" viewBox="0 0 200 200" fill="none">
      <circle cx="100" cy="100" r="80" fill="#FEF9C3" />
      <path d="M100 50 L150 75 L150 125 L100 150 L50 125 L50 75 Z" fill="white" stroke="#EAB308" strokeWidth="2" />
      <path d="M100 50 L100 100 L50 75" fill="#FEF08A" stroke="#EAB308" strokeWidth="2" />
      <path d="M100 100 L150 75" stroke="#EAB308" strokeWidth="2" />
      <path d="M100 100 L100 150" stroke="#EAB308" strokeWidth="2" />
      <circle cx="100" cy="100" r="15" fill="#EAB308" />
      <path d="M95 100 L100 105 L108 95" stroke="white" strokeWidth="2" />
    </svg>
  ),
  folder: (
    <svg className="mx-auto w-48 h-48" viewBox="0 0 200 200" fill="none">
      <circle cx="100" cy="100" r="80" fill="#FFF7ED" />
      <path d="M45 75 L45 145 Q45 150 50 150 L150 150 Q155 150 155 145 L155 85 Q155 80 150 80 L105 80 L95 70 L50 70 Q45 70 45 75 Z" fill="#FB923C" />
      <path d="M50 80 L50 140 Q50 145 55 145 L145 145 Q150 145 150 140 L150 90 Q150 85 145 85 L100 85 L90 75 L55 75 Q50 75 50 80 Z" fill="white" stroke="#FB923C" strokeWidth="2" />
      <circle cx="100" cy="115" r="15" fill="#FDBA74" />
      <path d="M95 115 L100 120 L108 110" stroke="#EA580C" strokeWidth="2" />
    </svg>
  ),
  invoice: (
    <svg className="mx-auto w-48 h-48" viewBox="0 0 200 200" fill="none">
      <circle cx="100" cy="100" r="80" fill="#F0FDF4" />
      <rect x="55" y="35" width="90" height="120" rx="6" fill="white" stroke="#86EFAC" strokeWidth="2" />
      <rect x="55" y="35" width="90" height="25" rx="6" fill="#22C55E" />
      <text x="100" y="52" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">FACTURE</text>
      <line x1="70" y1="75" x2="130" y2="75" stroke="#BBF7D0" strokeWidth="2" />
      <line x1="70" y1="90" x2="110" y2="90" stroke="#BBF7D0" strokeWidth="2" />
      <line x1="70" y1="105" x2="120" y2="105" stroke="#BBF7D0" strokeWidth="2" />
      <rect x="70" y="120" width="60" height="20" rx="4" fill="#DCFCE7" />
      <text x="100" y="134" textAnchor="middle" fill="#16A34A" fontSize="10" fontWeight="bold">€ 0.00</text>
      <circle cx="145" cy="140" r="20" fill="#22C55E" />
      <path d="M140 140 L144 144 L153 135" stroke="white" strokeWidth="3" strokeLinecap="round" />
    </svg>
  ),
  payment: (
    <svg className="mx-auto w-48 h-48" viewBox="0 0 200 200" fill="none">
      <circle cx="100" cy="100" r="80" fill="#EFF6FF" />
      <rect x="40" y="70" width="120" height="75" rx="10" fill="white" stroke="#93C5FD" strokeWidth="2" />
      <rect x="40" y="85" width="120" height="20" fill="#3B82F6" />
      <rect x="55" y="120" width="40" height="10" rx="2" fill="#BFDBFE" />
      <rect x="105" y="120" width="40" height="10" rx="2" fill="#BFDBFE" />
      <circle cx="140" cy="55" r="25" fill="#3B82F6" />
      <text x="140" y="62" textAnchor="middle" fill="white" fontSize="20" fontWeight="bold">€</text>
    </svg>
  ),
  company: (
    <svg className="mx-auto w-48 h-48" viewBox="0 0 200 200" fill="none">
      <circle cx="100" cy="100" r="80" fill="#F5F3FF" />
      <rect x="60" y="60" width="80" height="100" rx="6" fill="white" stroke="#C4B5FD" strokeWidth="2" />
      <rect x="75" y="75" width="20" height="20" rx="2" fill="#8B5CF6" />
      <rect x="105" y="75" width="20" height="20" rx="2" fill="#A78BFA" />
      <rect x="75" y="105" width="20" height="20" rx="2" fill="#A78BFA" />
      <rect x="105" y="105" width="20" height="20" rx="2" fill="#8B5CF6" />
      <rect x="90" y="135" width="20" height="25" rx="2" fill="#7C3AED" />
      <path d="M60 60 L100 40 L140 60" fill="#8B5CF6" />
    </svg>
  ),
  project: (
    <svg className="mx-auto w-48 h-48" viewBox="0 0 200 200" fill="none">
      <circle cx="100" cy="100" r="80" fill="#ECFEFF" />
      <rect x="50" y="50" width="100" height="100" rx="8" fill="white" stroke="#67E8F9" strokeWidth="2" />
      <rect x="60" y="65" width="80" height="8" rx="4" fill="#E0F2FE" />
      <rect x="60" y="65" width="50" height="8" rx="4" fill="#06B6D4" />
      <rect x="60" y="85" width="80" height="8" rx="4" fill="#E0F2FE" />
      <rect x="60" y="85" width="65" height="8" rx="4" fill="#22D3EE" />
      <rect x="60" y="105" width="80" height="8" rx="4" fill="#E0F2FE" />
      <rect x="60" y="105" width="30" height="8" rx="4" fill="#67E8F9" />
      <circle cx="140" cy="130" r="18" fill="#06B6D4" />
      <text x="140" y="136" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">75%</text>
    </svg>
  ),
  task: (
    <svg className="mx-auto w-48 h-48" viewBox="0 0 200 200" fill="none">
      <circle cx="100" cy="100" r="80" fill="#FEF2F2" />
      <rect x="55" y="45" width="90" height="110" rx="6" fill="white" stroke="#FECACA" strokeWidth="2" />
      <circle cx="75" cy="70" r="8" fill="#FCA5A5" />
      <path d="M72 70 L74 72 L79 67" stroke="white" strokeWidth="2" />
      <line x1="95" y1="70" x2="130" y2="70" stroke="#FECACA" strokeWidth="3" strokeLinecap="round" />
      <circle cx="75" cy="95" r="8" fill="#EF4444" />
      <path d="M72 95 L74 97 L79 92" stroke="white" strokeWidth="2" />
      <line x1="95" y1="95" x2="125" y2="95" stroke="#FECACA" strokeWidth="3" strokeLinecap="round" />
      <circle cx="75" cy="120" r="8" stroke="#FCA5A5" strokeWidth="2" fill="white" />
      <line x1="95" y1="120" x2="120" y2="120" stroke="#FECACA" strokeWidth="3" strokeLinecap="round" />
      <circle cx="145" cy="140" r="18" fill="#EF4444" />
      <path d="M140 140 L144 144 L153 135" stroke="white" strokeWidth="2" />
    </svg>
  ),
  inventory: (
    <svg className="mx-auto w-48 h-48" viewBox="0 0 200 200" fill="none">
      <circle cx="100" cy="100" r="80" fill="#FEF3C7" />
      <rect x="45" y="80" width="45" height="70" rx="4" fill="white" stroke="#FCD34D" strokeWidth="2" />
      <rect x="55" y="90" width="25" height="25" rx="2" fill="#FDE68A" />
      <rect x="55" y="125" width="25" height="15" rx="2" fill="#FCD34D" />
      <rect x="110" y="80" width="45" height="70" rx="4" fill="white" stroke="#FCD34D" strokeWidth="2" />
      <rect x="120" y="90" width="25" height="25" rx="2" fill="#FDE68A" />
      <rect x="120" y="125" width="25" height="15" rx="2" fill="#FCD34D" />
      <rect x="77.5" y="50" width="45" height="70" rx="4" fill="white" stroke="#F59E0B" strokeWidth="2" />
      <rect x="87.5" y="60" width="25" height="25" rx="2" fill="#FCD34D" />
      <rect x="87.5" y="95" width="25" height="15" rx="2" fill="#F59E0B" />
      <circle cx="100" cy="45" r="15" fill="#F59E0B" />
      <text x="100" y="50" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">0</text>
    </svg>
  ),
  employee: (
    <svg className="mx-auto w-48 h-48" viewBox="0 0 200 200" fill="none">
      <circle cx="100" cy="100" r="80" fill="#FCE7F3" />
      <circle cx="100" cy="70" r="30" fill="white" stroke="#F9A8D4" strokeWidth="2" />
      <circle cx="100" cy="65" r="15" fill="#EC4899" />
      <path d="M55 150 Q100 110 145 150" fill="#F472B6" />
      <rect x="80" y="95" width="40" height="35" rx="4" fill="white" stroke="#F9A8D4" strokeWidth="2" />
      <line x1="90" y1="105" x2="110" y2="105" stroke="#FBCFE8" strokeWidth="2" />
      <line x1="90" y1="115" x2="105" y2="115" stroke="#FBCFE8" strokeWidth="2" />
      <circle cx="140" cy="50" r="18" fill="#EC4899" />
      <path d="M135 50 L139 54 L148 45" stroke="white" strokeWidth="2" />
    </svg>
  ),
  workflow: (
    <svg className="mx-auto w-48 h-48" viewBox="0 0 200 200" fill="none">
      <circle cx="100" cy="100" r="80" fill="#EDE9FE" />
      <circle cx="60" cy="70" r="20" fill="#8B5CF6" />
      <circle cx="140" cy="70" r="20" fill="#A78BFA" />
      <circle cx="100" cy="130" r="20" fill="#7C3AED" />
      <path d="M78 78 L122 62" stroke="#C4B5FD" strokeWidth="3" />
      <path d="M68 88 L92 115" stroke="#C4B5FD" strokeWidth="3" />
      <path d="M132 88 L108 115" stroke="#C4B5FD" strokeWidth="3" />
      <path d="M56 66 L60 70 L68 62" stroke="white" strokeWidth="2" />
      <path d="M136 66 L140 70 L148 62" stroke="white" strokeWidth="2" />
      <path d="M96 126 L100 130 L108 122" stroke="white" strokeWidth="2" />
    </svg>
  ),
  audit: (
    <svg className="mx-auto w-48 h-48" viewBox="0 0 200 200" fill="none">
      <circle cx="100" cy="100" r="80" fill="#DBEAFE" />
      <circle cx="100" cy="100" r="50" fill="white" stroke="#93C5FD" strokeWidth="2" />
      <circle cx="100" cy="100" r="35" fill="#EFF6FF" />
      <path d="M100 70 L100 100 L125 100" stroke="#3B82F6" strokeWidth="3" strokeLinecap="round" />
      <circle cx="100" cy="100" r="5" fill="#3B82F6" />
      <circle cx="100" cy="60" r="4" fill="#93C5FD" />
      <circle cx="140" cy="100" r="4" fill="#93C5FD" />
      <circle cx="100" cy="140" r="4" fill="#93C5FD" />
      <circle cx="60" cy="100" r="4" fill="#93C5FD" />
      <circle cx="155" cy="55" r="20" fill="#3B82F6" />
      <path d="M150 55 L154 59 L163 50" stroke="white" strokeWidth="2" />
    </svg>
  ),
  receipt: (
    <svg className="mx-auto w-48 h-48" viewBox="0 0 200 200" fill="none">
      <circle cx="100" cy="100" r="80" fill="#F0FDF4" />
      <path d="M60 40 L140 40 L140 160 L130 150 L120 160 L110 150 L100 160 L90 150 L80 160 L70 150 L60 160 Z" fill="white" stroke="#86EFAC" strokeWidth="2" />
      <line x1="75" y1="65" x2="125" y2="65" stroke="#BBF7D0" strokeWidth="3" strokeLinecap="round" />
      <line x1="75" y1="85" x2="115" y2="85" stroke="#BBF7D0" strokeWidth="3" strokeLinecap="round" />
      <line x1="75" y1="105" x2="110" y2="105" stroke="#BBF7D0" strokeWidth="3" strokeLinecap="round" />
      <line x1="75" y1="125" x2="100" y2="125" stroke="#22C55E" strokeWidth="3" strokeLinecap="round" />
      <circle cx="145" cy="140" r="20" fill="#22C55E" />
      <path d="M140 140 L144 144 L153 135" stroke="white" strokeWidth="3" strokeLinecap="round" />
    </svg>
  ),
  wrench: (
    <svg className="mx-auto w-48 h-48" viewBox="0 0 200 200" fill="none">
      <circle cx="100" cy="100" r="80" fill="#FEF3C7" />
      <path d="M130 55 C145 70 145 95 130 110 L75 165 C70 170 60 170 55 165 L45 155 C40 150 40 140 45 135 L100 80 C85 65 85 40 100 25" fill="white" stroke="#F59E0B" strokeWidth="3" />
      <circle cx="60" cy="150" r="8" fill="#F59E0B" />
      <path d="M135 50 L150 35 L165 50 L150 65 Z" fill="#F59E0B" />
      <circle cx="150" cy="130" r="20" fill="#F59E0B" />
      <path d="M145 130 L149 134 L158 125" stroke="white" strokeWidth="3" strokeLinecap="round" />
    </svg>
  ),
  clipboard: (
    <svg className="mx-auto w-48 h-48" viewBox="0 0 200 200" fill="none">
      <circle cx="100" cy="100" r="80" fill="#EFF6FF" />
      <rect x="55" y="50" width="90" height="110" rx="6" fill="white" stroke="#93C5FD" strokeWidth="2" />
      <rect x="75" y="40" width="50" height="20" rx="4" fill="#3B82F6" />
      <circle cx="100" cy="50" r="5" fill="white" />
      <line x1="70" y1="80" x2="130" y2="80" stroke="#BFDBFE" strokeWidth="3" strokeLinecap="round" />
      <line x1="70" y1="100" x2="120" y2="100" stroke="#BFDBFE" strokeWidth="3" strokeLinecap="round" />
      <line x1="70" y1="120" x2="110" y2="120" stroke="#BFDBFE" strokeWidth="3" strokeLinecap="round" />
      <line x1="70" y1="140" x2="95" y2="140" stroke="#BFDBFE" strokeWidth="3" strokeLinecap="round" />
      <circle cx="145" cy="140" r="20" fill="#3B82F6" />
      <path d="M140 140 L144 144 L153 135" stroke="white" strokeWidth="3" strokeLinecap="round" />
    </svg>
  ),
  truck: (
    <svg className="mx-auto w-48 h-48" viewBox="0 0 200 200" fill="none">
      <circle cx="100" cy="100" r="80" fill="#EDE9FE" />
      <rect x="35" y="70" width="80" height="55" rx="4" fill="white" stroke="#A78BFA" strokeWidth="2" />
      <path d="M115 85 L115 125 L155 125 L155 100 L140 85 Z" fill="white" stroke="#A78BFA" strokeWidth="2" />
      <rect x="120" y="95" width="20" height="15" rx="2" fill="#DDD6FE" />
      <circle cx="65" cy="130" r="15" fill="#8B5CF6" />
      <circle cx="65" cy="130" r="8" fill="white" />
      <circle cx="135" cy="130" r="15" fill="#8B5CF6" />
      <circle cx="135" cy="130" r="8" fill="white" />
      <rect x="45" y="80" width="30" height="20" rx="2" fill="#DDD6FE" />
      <circle cx="155" cy="55" r="20" fill="#8B5CF6" />
      <path d="M150 55 L154 59 L163 50" stroke="white" strokeWidth="3" strokeLinecap="round" />
    </svg>
  ),
};

type EmptyStateIconType = keyof typeof EmptyStateIllustrations;

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: EmptyStateIconType;
  action?: {
    label: string;
    onClick: () => void;
  };
  children?: ReactNode;
}

export function EmptyState({
  title,
  description,
  icon = 'inbox',
  action,
  children,
}: EmptyStateProps) {
  return (
    <div className="py-16 px-6 text-center">
      <div className="mb-6 transform hover:scale-105 transition-transform duration-300">
        {EmptyStateIllustrations[icon]}
      </div>

      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>

      {description && (
        <p className="text-base text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">
          {description}
        </p>
      )}

      {action && (
        <button
          onClick={action.onClick}
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-lg shadow-blue-600/30 hover:shadow-blue-600/40 transition-all"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {action.label}
        </button>
      )}

      {children}
    </div>
  );
}
