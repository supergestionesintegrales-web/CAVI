// Perfiles vectoriales profesionales para CAVI.
// Se usan formas geométricas simples de persona, sin caricaturas ni fotografías.

const personVector = (primary: string, secondary: string, skin: string, hair: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${primary}"/>
      <stop offset="100%" stop-color="${secondary}"/>
    </linearGradient>
  </defs>
  <circle cx="60" cy="60" r="58" fill="url(#bg)"/>
  <circle cx="60" cy="43" r="20" fill="${skin}"/>
  <path d="M40 42c2-15 10-23 20-23 12 0 19 8 20 23-7-5-13-7-20-7s-14 2-20 7Z" fill="${hair}"/>
  <path d="M29 104c3-22 14-34 31-34s28 12 31 34H29Z" fill="${hair}"/>
  <path d="M39 82c6 5 14 8 21 8s15-3 21-8l10 22H29l10-22Z" fill="${skin}" opacity=".9"/>
  <path d="M45 49c4 3 9 4 15 4s11-1 15-4" fill="none" stroke="${hair}" stroke-width="2" stroke-linecap="round" opacity=".55"/>
  <circle cx="52" cy="43" r="2" fill="#0f172a"/>
  <circle cx="68" cy="43" r="2" fill="#0f172a"/>
</svg>`)}`;

export const CARTOON_SAMUEL_AVATAR = personVector('#0284c7', '#0369a1', '#d7a77d', '#172033');
export const CARTOON_KLEYDER_AVATAR = personVector('#2563eb', '#1d4ed8', '#c98f68', '#24324a');
export const CARTOON_JOSE_AVATAR = personVector('#0f766e', '#047857', '#8d5b3f', '#172033');
export const CARTOON_ADMIN_AVATAR = personVector('#0088ff', '#0047AB', '#d7a77d', '#0f172a');
