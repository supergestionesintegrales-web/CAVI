// High quality vector cartoon / caricature avatars for CAVI personnel
// Perfectly rounded circular avatars with cheerful expressions, field audit accessories and high contrast.

export const CARTOON_SAMUEL_AVATAR = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <defs>
    <linearGradient id="samuelBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8"/>
      <stop offset="100%" stop-color="#0284c7"/>
    </linearGradient>
    <linearGradient id="skin" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fed7aa"/>
      <stop offset="100%" stop-color="#fba868"/>
    </linearGradient>
    <linearGradient id="capGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#1e293b"/>
    </linearGradient>
  </defs>
  <!-- Rounded Circle Base -->
  <circle cx="60" cy="60" r="58" fill="url(#samuelBg)" stroke="#ffffff" stroke-width="4"/>
  <circle cx="60" cy="60" r="54" fill="none" stroke="#e0f2fe" stroke-width="1.5" opacity="0.6"/>

  <!-- Body & Vest -->
  <path d="M22 114 C 24 88, 38 78, 60 78 C 82 78, 96 88, 98 114 Z" fill="#0088ff"/>
  <!-- Safety Vest stripes -->
  <path d="M38 82 L34 114 M82 82 L86 114" stroke="#4edea3" stroke-width="6" stroke-linecap="round"/>
  <!-- Lanyard & ID badge -->
  <path d="M52 82 L57 98 L60 98 L65 82" fill="none" stroke="#f59e0b" stroke-width="2.5"/>
  <rect x="54" y="97" width="12" height="15" rx="2" fill="#ffffff" stroke="#cbd5e1" stroke-width="1"/>
  <rect x="56" y="99" width="8" height="4" rx="1" fill="#0088ff"/>
  <line x1="56" y1="106" x2="64" y2="106" stroke="#94a3b8" stroke-width="1"/>
  <line x1="56" y1="109" x2="62" y2="109" stroke="#94a3b8" stroke-width="1"/>

  <!-- Neck -->
  <rect x="52" y="66" width="16" height="16" rx="4" fill="url(#skin)"/>

  <!-- Head / Face -->
  <ellipse cx="60" cy="54" rx="22" ry="24" fill="url(#skin)"/>

  <!-- Ears -->
  <circle cx="38" cy="54" r="6" fill="#fba868"/>
  <circle cx="82" cy="54" r="6" fill="#fba868"/>

  <!-- Hair / Cap -->
  <path d="M36 48 C 36 30, 84 30, 84 48 C 84 48, 76 38, 60 38 C 44 38, 36 48, 36 48 Z" fill="#334155"/>
  <!-- Tactical Cap -->
  <path d="M36 44 C 36 26, 84 26, 84 44 Z" fill="url(#capGrad)"/>
  <!-- Cap Visor (brim) -->
  <path d="M32 44 Q 60 48 88 44 C 84 39, 36 39, 32 44 Z" fill="#0284c7"/>
  <!-- Cap logo "CAVI" -->
  <circle cx="60" cy="34" r="4.5" fill="#38bdf8"/>
  <path d="M58 34 L62 34" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round"/>

  <!-- Glasses -->
  <rect x="42" y="47" width="14" height="11" rx="3.5" fill="#e0f2fe" fill-opacity="0.4" stroke="#0f172a" stroke-width="2.5"/>
  <rect x="64" y="47" width="14" height="11" rx="3.5" fill="#e0f2fe" fill-opacity="0.4" stroke="#0f172a" stroke-width="2.5"/>
  <line x1="56" y1="52" x2="64" y2="52" stroke="#0f172a" stroke-width="2.5"/>
  <line x1="38" y1="51" x2="42" y2="51" stroke="#0f172a" stroke-width="2"/>
  <line x1="78" y1="51" x2="82" y2="51" stroke="#0f172a" stroke-width="2"/>

  <!-- Eyes behind glasses -->
  <circle cx="49" cy="52.5" r="2.5" fill="#0f172a"/>
  <circle cx="50" cy="51.5" r="0.9" fill="#ffffff"/>
  <circle cx="71" cy="52.5" r="2.5" fill="#0f172a"/>
  <circle cx="72" cy="51.5" r="0.9" fill="#ffffff"/>

  <!-- Cheerful Eyebrows -->
  <path d="M43 44 Q 49 41 55 43" fill="none" stroke="#0f172a" stroke-width="2" stroke-linecap="round"/>
  <path d="M65 43 Q 71 41 77 44" fill="none" stroke="#0f172a" stroke-width="2" stroke-linecap="round"/>

  <!-- Nose -->
  <path d="M59 55 Q 61 58 62 58" fill="none" stroke="#ea580c" stroke-width="2" stroke-linecap="round"/>

  <!-- Big Friendly Smile -->
  <path d="M51 63 Q 60 71 69 63" fill="#ffffff" stroke="#0f172a" stroke-width="2" stroke-linejoin="round"/>
  <!-- Rosy Cheeks -->
  <ellipse cx="43" cy="59" rx="3.5" ry="2" fill="#fb7185" opacity="0.6"/>
  <ellipse cx="77" cy="59" rx="3.5" ry="2" fill="#fb7185" opacity="0.6"/>
</svg>
`)}`;

export const CARTOON_KLEYDER_AVATAR = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <defs>
    <linearGradient id="kleyderBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#a855f7"/>
      <stop offset="100%" stop-color="#6366f1"/>
    </linearGradient>
    <linearGradient id="kleyderSkin" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffedd5"/>
      <stop offset="100%" stop-color="#fdba74"/>
    </linearGradient>
    <linearGradient id="hairGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#451a03"/>
      <stop offset="100%" stop-color="#1f2937"/>
    </linearGradient>
  </defs>
  <!-- Rounded Circle Base -->
  <circle cx="60" cy="60" r="58" fill="url(#kleyderBg)" stroke="#ffffff" stroke-width="4"/>
  <circle cx="60" cy="60" r="54" fill="none" stroke="#f3e8ff" stroke-width="1.5" opacity="0.6"/>

  <!-- Body / Field Jacket -->
  <path d="M22 114 C 24 88, 38 78, 60 78 C 82 78, 96 88, 98 114 Z" fill="#1e1b4b"/>
  <!-- Polo Shirt Inner -->
  <path d="M48 78 L60 92 L72 78 Z" fill="#38bdf8"/>
  <path d="M56 86 L60 92 L64 86" stroke="#ffffff" stroke-width="2"/>
  <!-- Audit Field Badge -->
  <rect x="70" y="88" width="14" height="18" rx="2" fill="#ffffff" stroke="#cbd5e1" stroke-width="1"/>
  <circle cx="77" cy="94" r="3" fill="#a855f7"/>
  <line x1="73" y1="100" x2="81" y2="100" stroke="#94a3b8" stroke-width="1.5"/>

  <!-- Neck -->
  <rect x="52" y="66" width="16" height="15" rx="4" fill="url(#kleyderSkin)"/>

  <!-- Head / Face -->
  <ellipse cx="60" cy="54" rx="21" ry="23" fill="url(#kleyderSkin)"/>

  <!-- Ears -->
  <circle cx="39" cy="54" r="5.5" fill="#fdba74"/>
  <circle cx="81" cy="54" r="5.5" fill="#fdba74"/>

  <!-- Stylish Modern Hair -->
  <path d="M38 48 C 36 28, 48 20, 60 22 C 72 20, 84 28, 82 48 C 80 34, 72 30, 60 30 C 48 30, 40 34, 38 48 Z" fill="url(#hairGrad)"/>
  <path d="M40 38 Q 62 26 78 35 Q 60 30 40 38 Z" fill="#78350f"/>

  <!-- Bluetooth Headset / Mic for field communication -->
  <circle cx="82" cy="54" r="3" fill="#0088ff"/>
  <path d="M82 55 Q 78 65 70 66" fill="none" stroke="#0088ff" stroke-width="1.5" stroke-linecap="round"/>
  <circle cx="70" cy="66" r="1.8" fill="#38bdf8"/>

  <!-- Expressive Friendly Eyes -->
  <ellipse cx="50" cy="51" rx="3" ry="3.5" fill="#1e1b4b"/>
  <circle cx="51" cy="50" r="1.1" fill="#ffffff"/>
  <ellipse cx="70" cy="51" rx="3" ry="3.5" fill="#1e1b4b"/>
  <circle cx="71" cy="50" r="1.1" fill="#ffffff"/>

  <!-- Dynamic Eyebrows -->
  <path d="M45 44 Q 50 41 55 43" fill="none" stroke="#1f2937" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M65 43 Q 70 41 75 44" fill="none" stroke="#1f2937" stroke-width="2.5" stroke-linecap="round"/>

  <!-- Nose -->
  <path d="M59 54 Q 61 57 62 56" fill="none" stroke="#ea580c" stroke-width="1.8" stroke-linecap="round"/>

  <!-- Confident Smile with white teeth -->
  <path d="M52 61 Q 60 70 68 61 Z" fill="#ffffff" stroke="#1e1b4b" stroke-width="2"/>
  <path d="M54 62 Q 60 67 66 62" stroke="#ea580c" stroke-width="1" fill="none"/>

  <!-- Cheerful Rosy Blush -->
  <circle cx="44" cy="58" r="3" fill="#f43f5e" opacity="0.4"/>
  <circle cx="76" cy="58" r="3" fill="#f43f5e" opacity="0.4"/>
</svg>
`)}`;

export const CARTOON_JOSE_AVATAR = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <defs>
    <linearGradient id="joseBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#10b981"/>
      <stop offset="100%" stop-color="#059669"/>
    </linearGradient>
    <linearGradient id="joseSkin" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fed7aa"/>
      <stop offset="100%" stop-color="#ea580c"/>
    </linearGradient>
    <linearGradient id="helmetGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef08a"/>
      <stop offset="50%" stop-color="#facc15"/>
      <stop offset="100%" stop-color="#eab308"/>
    </linearGradient>
  </defs>
  <!-- Rounded Circle Base -->
  <circle cx="60" cy="60" r="58" fill="url(#joseBg)" stroke="#ffffff" stroke-width="4"/>
  <circle cx="60" cy="60" r="54" fill="none" stroke="#d1fae5" stroke-width="1.5" opacity="0.6"/>

  <!-- Body / Industrial Safety Work Shirt -->
  <path d="M22 114 C 24 88, 38 78, 60 78 C 82 78, 96 88, 98 114 Z" fill="#0f766e"/>
  <!-- High-Vis Vest Straps -->
  <path d="M38 82 L34 114 M82 82 L86 114" stroke="#facc15" stroke-width="7" stroke-linecap="round"/>
  <!-- Reflective silver band -->
  <path d="M38 96 L82 96" stroke="#ffffff" stroke-width="4" stroke-linecap="round"/>

  <!-- Neck -->
  <rect x="52" y="66" width="16" height="16" rx="4" fill="#fb923c"/>

  <!-- Head / Face -->
  <ellipse cx="60" cy="55" rx="22" ry="23" fill="#fb923c"/>

  <!-- Ears -->
  <circle cx="38" cy="55" r="5.5" fill="#ea580c"/>
  <circle cx="82" cy="55" r="5.5" fill="#ea580c"/>

  <!-- Yellow Safety Hard Hat (Casco de Seguridad de Campo) -->
  <path d="M34 44 C 34 22, 86 22, 86 44 Z" fill="url(#helmetGrad)"/>
  <!-- Helmet Ridge -->
  <path d="M57 24 L63 24 L62 44 L58 44 Z" fill="#ca8a04"/>
  <!-- Helmet Brim -->
  <path d="M28 44 Q 60 48 92 44 L88 41 Q 60 44 32 41 Z" fill="#eab308"/>
  <!-- Safety light / emblem on helmet -->
  <circle cx="60" cy="36" r="4" fill="#0284c7" stroke="#ffffff" stroke-width="1.5"/>

  <!-- Friendly Eyes with Experience Lines -->
  <circle cx="49" cy="51" r="2.8" fill="#1e293b"/>
  <circle cx="50" cy="50" r="1" fill="#ffffff"/>
  <circle cx="71" cy="51" r="2.8" fill="#1e293b"/>
  <circle cx="72" cy="50" r="1" fill="#ffffff"/>

  <!-- Laugh Lines -->
  <path d="M43 51 Q 41 53 43 55" fill="none" stroke="#c2410c" stroke-width="1.2" stroke-linecap="round"/>
  <path d="M77 51 Q 79 53 77 55" fill="none" stroke="#c2410c" stroke-width="1.2" stroke-linecap="round"/>

  <!-- Eyebrows -->
  <path d="M43 45 Q 49 42 55 45" fill="none" stroke="#475569" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M65 45 Q 71 42 77 45" fill="none" stroke="#475569" stroke-width="2.5" stroke-linecap="round"/>

  <!-- Nose -->
  <ellipse cx="60" cy="54" rx="3.5" ry="3" fill="#ea580c"/>

  <!-- Friendly Characteristic Moustache (Bigote Amigable) -->
  <path d="M46 62 Q 53 58 60 62 Q 67 58 74 62 Q 72 67 60 66 Q 48 67 46 62 Z" fill="#334155"/>

  <!-- Warm Grin -->
  <path d="M53 67 Q 60 73 67 67" fill="#ffffff" stroke="#1e293b" stroke-width="1.5"/>
</svg>
`)}`;

export const CARTOON_ADMIN_AVATAR = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <defs>
    <linearGradient id="adminBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0088ff"/>
      <stop offset="100%" stop-color="#1d4ed8"/>
    </linearGradient>
    <linearGradient id="adminSkin" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fde047"/>
      <stop offset="100%" stop-color="#f59e0b"/>
    </linearGradient>
  </defs>
  <!-- Rounded Circle Base -->
  <circle cx="60" cy="60" r="58" fill="url(#adminBg)" stroke="#ffffff" stroke-width="4"/>
  <circle cx="60" cy="60" r="54" fill="none" stroke="#bae6fd" stroke-width="1.5" opacity="0.6"/>

  <!-- Executive Blazer / Uniform -->
  <path d="M22 114 C 24 88, 38 78, 60 78 C 82 78, 96 88, 98 114 Z" fill="#0f172a"/>
  <!-- White Shirt & Tie -->
  <path d="M52 78 L60 94 L68 78 Z" fill="#ffffff"/>
  <path d="M58 84 L62 84 L64 104 L60 108 L56 104 Z" fill="#0088ff"/>
  <!-- Gold Master Admin Star / Shield -->
  <polygon points="36,92 38,98 44,98 39,102 41,108 36,104 31,108 33,102 28,98 34,98" fill="#facc15" stroke="#ca8a04" stroke-width="0.8"/>

  <!-- Neck -->
  <rect x="52" y="66" width="16" height="15" rx="4" fill="#fed7aa"/>

  <!-- Head / Face -->
  <ellipse cx="60" cy="53" rx="22" ry="23" fill="#fed7aa"/>

  <!-- Ears -->
  <circle cx="38" cy="53" r="5.5" fill="#fba868"/>
  <circle cx="82" cy="53" r="5.5" fill="#fba868"/>

  <!-- Sleek Professional Dark Hair -->
  <path d="M38 46 C 36 28, 48 20, 60 21 C 72 20, 84 28, 82 46 C 80 32, 70 28, 60 28 C 48 28, 40 32, 38 46 Z" fill="#0f172a"/>

  <!-- Smart Executive Glasses -->
  <rect x="42" y="46" width="15" height="11" rx="3" fill="#e0f2fe" fill-opacity="0.3" stroke="#0088ff" stroke-width="2.5"/>
  <rect x="63" y="46" width="15" height="11" rx="3" fill="#e0f2fe" fill-opacity="0.3" stroke="#0088ff" stroke-width="2.5"/>
  <line x1="57" y1="51" x2="63" y2="51" stroke="#0088ff" stroke-width="2.5"/>
  <line x1="38" y1="50" x2="42" y2="50" stroke="#0088ff" stroke-width="2"/>
  <line x1="78" y1="50" x2="82" y2="50" stroke="#0088ff" stroke-width="2"/>

  <!-- Confident Eyes -->
  <circle cx="49.5" cy="51.5" r="2.5" fill="#0f172a"/>
  <circle cx="50.5" cy="50.5" r="0.9" fill="#ffffff"/>
  <circle cx="70.5" cy="51.5" r="2.5" fill="#0f172a"/>
  <circle cx="71.5" cy="50.5" r="0.9" fill="#ffffff"/>

  <!-- Eyebrows -->
  <path d="M43 43 Q 49 40 55 43" fill="none" stroke="#0f172a" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M65 43 Q 71 40 77 43" fill="none" stroke="#0f172a" stroke-width="2.5" stroke-linecap="round"/>

  <!-- Nose -->
  <path d="M59 54 Q 61 57 62 56" fill="none" stroke="#ea580c" stroke-width="1.8" stroke-linecap="round"/>

  <!-- Executive Smile -->
  <path d="M52 61 Q 60 69 68 61" fill="#ffffff" stroke="#0f172a" stroke-width="2" stroke-linejoin="round"/>
</svg>
`)}`;
