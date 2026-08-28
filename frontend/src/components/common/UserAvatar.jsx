import React, { useState } from 'react';
import { getAvatarUrl } from '../../services/api';

// Department-based and name-hash-based vibrant gradient palettes
const AVATAR_GRADIENTS = [
  'from-blue-600 to-cyan-500 text-white',
  'from-indigo-600 to-purple-500 text-white',
  'from-emerald-600 to-teal-500 text-white',
  'from-violet-600 to-fuchsia-500 text-white',
  'from-sky-600 to-blue-500 text-white',
  'from-amber-600 to-orange-500 text-white',
  'from-rose-600 to-pink-500 text-white',
  'from-teal-600 to-emerald-500 text-white',
  'from-purple-600 to-indigo-500 text-white',
];

const SIZE_MAP = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-xs font-bold',
  lg: 'w-12 h-12 text-sm font-bold',
  xl: 'w-14 h-14 text-base font-bold',
  '2xl': 'w-16 h-16 text-lg font-bold',
  '3xl': 'w-20 h-20 text-xl font-bold',
};

export function getInitials(name) {
  if (!name || typeof name !== 'string') return '?';
  
  // Clean special characters and parentheses like (Azubi)
  const cleanName = name.replace(/\([^)]*\)/g, '').trim();
  const parts = cleanName.split(/\s+/).filter(Boolean);
  
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getGradient(name) {
  if (!name) return AVATAR_GRADIENTS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_GRADIENTS.length;
  return AVATAR_GRADIENTS[index];
}

/**
 * UserAvatar Component
 * Handles rendering user photos safely with automatic graceful fallback to stylized initials gradient.
 * Never shows a broken image icon.
 */
export function UserAvatar({
  src,
  name = '',
  size = 'md',
  className = '',
  rounded = 'rounded-2xl',
  alt,
  showBadge = false,
  badgeContent,
}) {
  const [imageError, setImageError] = useState(false);
  const resolvedUrl = getAvatarUrl(src);
  const sizeClasses = SIZE_MAP[size] || size;
  const initials = getInitials(name);
  const gradient = getGradient(name);

  const hasValidImage = resolvedUrl && !imageError;

  return (
    <div className={`relative inline-block shrink-0 ${sizeClasses}`}>
      <div
        className={`w-full h-full overflow-hidden flex items-center justify-center select-none shadow-xs transition-all ${rounded} ${className} ${
          !hasValidImage ? `bg-gradient-to-br ${gradient}` : 'bg-slate-100'
        }`}
      >
        {hasValidImage ? (
          <img
            src={resolvedUrl}
            alt={alt || name || 'Mitarbeiter'}
            onError={() => setImageError(true)}
            className={`w-full h-full object-cover ${rounded}`}
            loading="lazy"
          />
        ) : (
          <span className="font-bold tracking-wider drop-shadow-2xs">{initials}</span>
        )}
      </div>

      {showBadge && (
        <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full">
          {badgeContent}
        </span>
      )}
    </div>
  );
}
