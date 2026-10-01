// High quality vector SVG avatars for CAVI personnel and system users
// Clean, modern, high-definition vector illustrations with distinct roles, high contrast, and crisp vector lines.

export const CARTOON_SAMUEL_AVATAR = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <defs>
    <linearGradient id="samBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0284c7"/>
      <stop offset="100%" stop-color="#0369a1"/>
    </linearGradient>
    <linearGradient id="samSkin" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fed7aa"/>
      <stop offset="100%" stop-color="#fdba74"/>
    </linearGradient>
    <linearGradient id="samCap" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#1e293b"/>
    </linearGradient>
  </defs>
  <!-- Background Circle Base -->
  <circle cx="60" cy="60" r="58" fill="url(#samBg)" stroke="#38bdf8" stroke-width="3"/>
  <circle cx="60" cy="60" r="54" fill="none" stroke="#bae6fd" stroke-width="1.5" opacity="0.4"/>

  <!-- Body / Auditor Polo -->
  <path d="M24 116 C 26 88, 40 76, 60 76 C 80 76, 94 88, 96 116 Z" fill="#0088ff"/>
  <!-- Safety Vest accents -->
  <path d="M38 80 L32 116" stroke="#4edea3" stroke-width="5" stroke-linecap="round"/>
  <path d="M82 80 L88 116" stroke="#4edea3" stroke-width="5" stroke-linecap="round"/>
  <!-- Collar & Badge -->
  <path d="M52 76 L60 88 L68 76" fill="#0070d8"/>
  <rect x="54" y="94" width="12" height="16" rx="2" fill="#ffffff" stroke="#cbd5e1" stroke-width="1"/>
  <rect x="56" y="96" width="8" height="4" rx="1" fill="#0088ff"/>
  <line x1="56" y1="103" x2="64" y2="103" stroke="#64748b" stroke-width="1"/>
  <line x1="56" y1="106" x2="62" y2="106" stroke="#64748b" stroke-width="1"/>

  <!-- Neck -->
  <rect x="52" y="64" width="16" height="16" rx="4" fill="url(#samSkin)"/>

  <!-- Head / Face -->
  <ellipse cx="60" cy="52" rx="22" ry="24" fill="url(#samSkin)"/>

  <!-- Ears -->
  <circle cx="38" cy="52" r="5.5" fill="#fdba74"/>
  <circle cx="82" cy="52" r="5.5" fill="#fdba74"/>

  <!-- Tactical Cap -->
  <path d="M37 42 C 37 24, 83 24, 83 42 Z" fill="url(#samCap)"/>
  <!-- Cap Visor -->
  <path d="M32 42 Q 60 46 88 42 C 84 37, 36 37, 32 42 Z" fill="#0284c7"/>
  <!-- Cap Emblem -->
  <circle cx="60" cy="33" r="4.5" fill="#38bdf8"/>
  <path d="M57 33 L63 33" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round"/>

  <!-- Eyes & Glasses -->
  <rect x="42" y="46" width="14" height="11" rx="3.5" fill="#e0f2fe" fill-opacity="0.45" stroke="#0f172a" stroke-width="2.2"/>
  <rect x="64" y="46" width="14" height="11" rx="3.5" fill="#e0f2fe" fill-opacity="0.45" stroke="#0f172a" stroke-width="2.2"/>
  <line x1="56" y1="51" x2="64" y2="51" stroke="#0f172a" stroke-width="2.2"/>
  <circle cx="49" cy="51.5" r="2.2" fill="#0f172a"/>
  <circle cx="71" cy="51.5" r="2.2" fill="#0f172a"/>

  <!-- Friendly Smile -->
  <path d="M53 62 Q 60 67 67 62" fill="none" stroke="#9a3412" stroke-width="2.2" stroke-linecap="round"/>
</svg>
`)}`;

export const CARTOON_KLEYDER_AVATAR = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <defs>
    <linearGradient id="kleyBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#8b5cf6"/>
      <stop offset="100%" stop-color="#6d28d9"/>
    </linearGradient>
    <linearGradient id="kleySkin" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fcd34d"/>
      <stop offset="100%" stop-color="#f59e0b"/>
    </linearGradient>
  </defs>
  <!-- Background Circle Base -->
  <circle cx="60" cy="60" r="58" fill="url(#kleyBg)" stroke="#c4b5fd" stroke-width="3"/>
  <circle cx="60" cy="60" r="54" fill="none" stroke="#ede9fe" stroke-width="1.5" opacity="0.4"/>

  <!-- Body / Field Jacket -->
  <path d="M24 116 C 26 88, 40 76, 60 76 C 80 76, 94 88, 96 116 Z" fill="#1e1b4b"/>
  <!-- Safety Accents -->
  <path d="M42 80 L38 116" stroke="#a78bfa" stroke-width="4.5" stroke-linecap="round"/>
  <path d="M78 80 L82 116" stroke="#a78bfa" stroke-width="4.5" stroke-linecap="round"/>
  <!-- Badge -->
  <rect x="54" y="94" width="12" height="16" rx="2" fill="#ffffff" stroke="#cbd5e1" stroke-width="1"/>
  <rect x="56" y="96" width="8" height="4" rx="1" fill="#7c3aed"/>
  <line x1="56" y1="103" x2="64" y2="103" stroke="#64748b" stroke-width="1"/>

  <!-- Neck -->
  <rect x="52" y="64" width="16" height="16" rx="4" fill="url(#kleySkin)"/>

  <!-- Head / Face -->
  <ellipse cx="60" cy="52" rx="22" ry="24" fill="url(#kleySkin)"/>

  <!-- Modern Styled Hair -->
  <path d="M37 46 C 36 28, 84 28, 83 46 C 83 46, 75 34, 60 34 C 45 34, 37 46, 37 46 Z" fill="#18181b"/>
  <path d="M42 34 C 48 24, 72 24, 78 34 Z" fill="#27272a"/>

  <!-- Ears & Headset -->
  <circle cx="38" cy="52" r="5.5" fill="#f59e0b"/>
  <circle cx="82" cy="52" r="5.5" fill="#f59e0b"/>
  <!-- Headset arch -->
  <path d="M37 50 C 37 28, 83 28, 83 50" fill="none" stroke="#38bdf8" stroke-width="2.5" stroke-linecap="round"/>
  <rect x="34" y="46" width="6" height="12" rx="3" fill="#0284c7"/>
  <!-- Mic Boom -->
  <path d="M37 54 Q 45 64 56 64" fill="none" stroke="#38bdf8" stroke-width="2" stroke-linecap="round"/>
  <circle cx="57" cy="64" r="2.5" fill="#38bdf8"/>

  <!-- Eyes & Brows -->
  <path d="M44 45 Q 49 43 54 45" fill="none" stroke="#18181b" stroke-width="2" stroke-linecap="round"/>
  <path d="M66 45 Q 71 43 76 45" fill="none" stroke="#18181b" stroke-width="2" stroke-linecap="round"/>
  <circle cx="49" cy="51" r="2.4" fill="#18181b"/>
  <circle cx="71" cy="51" r="2.4" fill="#18181b"/>

  <!-- Neat Goatee & Smile -->
  <path d="M54 62 Q 60 67 66 62" fill="none" stroke="#78350f" stroke-width="2.2" stroke-linecap="round"/>
  <path d="M57 66 Q 60 68 63 66" fill="none" stroke="#27272a" stroke-width="2" stroke-linecap="round"/>
</svg>
`)}`;

export const CARTOON_JOSE_AVATAR = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <defs>
    <linearGradient id="joseBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#059669"/>
      <stop offset="100%" stop-color="#047857"/>
    </linearGradient>
    <linearGradient id="joseSkin" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fed7aa"/>
      <stop offset="100%" stop-color="#fb923c"/>
    </linearGradient>
    <linearGradient id="helmetGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#facc15"/>
      <stop offset="100%" stop-color="#eab308"/>
    </linearGradient>
  </defs>
  <!-- Background Circle Base -->
  <circle cx="60" cy="60" r="58" fill="url(#joseBg)" stroke="#6ee7b7" stroke-width="3"/>
  <circle cx="60" cy="60" r="54" fill="none" stroke="#d1fae5" stroke-width="1.5" opacity="0.4"/>

  <!-- Body / Heavy Field Vest -->
  <path d="M24 116 C 26 88, 40 76, 60 76 C 80 76, 94 88, 96 116 Z" fill="#047857"/>
  <!-- Bright Yellow Reflective Straps -->
  <path d="M38 78 L32 116" stroke="#facc15" stroke-width="6" stroke-linecap="round"/>
  <path d="M82 78 L88 116" stroke="#facc15" stroke-width="6" stroke-linecap="round"/>
  <!-- Central Badge -->
  <rect x="54" y="94" width="12" height="16" rx="2" fill="#ffffff" stroke="#cbd5e1" stroke-width="1"/>
  <rect x="56" y="96" width="8" height="4" rx="1" fill="#059669"/>
  <line x1="56" y1="103" x2="64" y2="103" stroke="#64748b" stroke-width="1"/>

  <!-- Neck -->
  <rect x="52" y="64" width="16" height="16" rx="4" fill="url(#joseSkin)"/>

  <!-- Head / Face -->
  <ellipse cx="60" cy="52" rx="22" ry="24" fill="url(#joseSkin)"/>

  <!-- Ears -->
  <circle cx="38" cy="52" r="5.5" fill="#fb923c"/>
  <circle cx="82" cy="52" r="5.5" fill="#fb923c"/>

  <!-- Safety Hardhat (Casco de Seguridad de Terreno Minero/Portuario) -->
  <path d="M34 42 C 34 22, 86 22, 86 42 Z" fill="url(#helmetGrad)"/>
  <path d="M30 42 Q 60 46 90 42 C 86 37, 34 37, 30 42 Z" fill="#ca8a04"/>
  <!-- Helmet Ridge -->
  <rect x="57" y="22" width="6" height="20" rx="2" fill="#fef08a"/>

  <!-- Eyes & Eyebrows -->
  <circle cx="49" cy="50" r="2.5" fill="#1e293b"/>
  <circle cx="71" cy="50" r="2.5" fill="#1e293b"/>
  <path d="M44 44 Q 49 42 54 44" fill="none" stroke="#7c2d12" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M66 44 Q 71 42 76 44" fill="none" stroke="#7c2d12" stroke-width="2.5" stroke-linecap="round"/>

  <!-- Cheerful Mustache & Smile -->
  <path d="M48 60 Q 60 67 72 60" fill="none" stroke="#7c2d12" stroke-width="3" stroke-linecap="round"/>
  <path d="M53 62 Q 60 66 67 62" fill="none" stroke="#991b1b" stroke-width="2" stroke-linecap="round"/>
</svg>
`)}`;

export const CARTOON_ADMIN_AVATAR = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <defs>
    <linearGradient id="admBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0088ff"/>
      <stop offset="100%" stop-color="#0047AB"/>
    </linearGradient>
    <linearGradient id="admSkin" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fed7aa"/>
      <stop offset="100%" stop-color="#fdba74"/>
    </linearGradient>
  </defs>
  <!-- Background Circle Base -->
  <circle cx="60" cy="60" r="58" fill="url(#admBg)" stroke="#38bdf8" stroke-width="3"/>
  <circle cx="60" cy="60" r="54" fill="none" stroke="#e0f2fe" stroke-width="1.5" opacity="0.4"/>

  <!-- Director Corporate Suit / Tie -->
  <path d="M24 116 C 26 88, 40 76, 60 76 C 80 76, 94 88, 96 116 Z" fill="#0f172a"/>
  <!-- White Shirt V -->
  <path d="M50 76 L60 98 L70 76 Z" fill="#ffffff"/>
  <!-- Blue Tie -->
  <path d="M58 84 L62 84 L64 104 L60 110 L56 104 Z" fill="#0088ff"/>

  <!-- Neck -->
  <rect x="52" y="64" width="16" height="16" rx="4" fill="url(#admSkin)"/>

  <!-- Head / Face -->
  <ellipse cx="60" cy="50" rx="22" ry="24" fill="url(#admSkin)"/>

  <!-- Hair -->
  <path d="M37 44 C 36 24, 84 24, 83 44 C 83 44, 76 30, 60 30 C 44 30, 37 44, 37 44 Z" fill="#334155"/>
  <path d="M42 32 C 48 24, 72 24, 78 32 Z" fill="#475569"/>

  <!-- Ears -->
  <circle cx="38" cy="50" r="5.5" fill="#fdba74"/>
  <circle cx="82" cy="50" r="5.5" fill="#fdba74"/>

  <!-- Eyes & Glasses -->
  <rect x="42" y="44" width="14" height="11" rx="3.5" fill="#e0f2fe" fill-opacity="0.5" stroke="#1e293b" stroke-width="2.2"/>
  <rect x="64" y="44" width="14" height="11" rx="3.5" fill="#e0f2fe" fill-opacity="0.5" stroke="#1e293b" stroke-width="2.2"/>
  <line x1="56" y1="49" x2="64" y2="49" stroke="#1e293b" stroke-width="2.2"/>
  <circle cx="49" cy="49.5" r="2.2" fill="#0f172a"/>
  <circle cx="71" cy="49.5" r="2.2" fill="#0f172a"/>

  <!-- Confident Smile -->
  <path d="M53 60 Q 60 65 67 60" fill="none" stroke="#9a3412" stroke-width="2.2" stroke-linecap="round"/>
</svg>
`)}`;
