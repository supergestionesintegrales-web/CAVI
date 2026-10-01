// Perfiles vectoriales profesionales para CAVI.
// Avatar geométrico de persona: sin caricaturas, emojis ni fotografías.

const personVector = (primary: string, secondary: string, skin: string, hair: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
  <circle cx="60" cy="60" r="57" fill="#ffffff"/>
  <circle cx="60" cy="60" r="54" fill="none" stroke="${primary}" stroke-width="8"/>
  <circle cx="60" cy="43" r="20" fill="${skin}"/>
  <path d="M40 43c2-15 10-23 20-23 12 0 19 8 20 23-7-5-13-7-20-7s-14 2-20 7Z" fill="${hair}"/>
  <path d="M29 103c3-21 14-33 31-33s28 12 31 33H29Z" fill="${hair}"/>
  <path d="M39 82c6 5 14 8 21 8s15-3 21-8l10 21H29l10-21Z" fill="${primary}" opacity=".92"/>
  <circle cx="52" cy="43" r="2" fill="#0f172a"/>
  <circle cx="68" cy="43" r="2" fill="#0f172a"/>
</svg>`)}`;

export const CARTOON_SAMUEL_AVATAR = personVector('#1688d4', '#0b63b2', '#d7a77d', '#172033');
export const CARTOON_KLEYDER_AVATAR = personVector('#1688d4', '#0b63b2', '#c98f68', '#24324a');
export const CARTOON_JOSE_AVATAR = personVector('#1688d4', '#0b63b2', '#8d5b3f', '#172033');
export const CARTOON_ADMIN_AVATAR = personVector('#1688d4', '#0b63b2', '#d7a77d', '#0f172a');
