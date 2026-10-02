// Iconos vectoriales de personas para CAVI.
// Vectores simples y limpios de usuario / auditor: sin caricaturas, rostros ni detalles superfluos.

export const createPersonVectorIcon = (color: string = '#0088ff', bg: string = '#ffffff') =>
  `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <!-- Fondo circular limpio -->
  <circle cx="60" cy="60" r="57" fill="${bg}"/>
  <!-- Anillo exterior nítido -->
  <circle cx="60" cy="60" r="53" fill="none" stroke="${color}" stroke-width="6"/>
  <!-- Cabeza de silueta vectorial -->
  <circle cx="60" cy="44" r="15" fill="${color}"/>
  <!-- Torso y hombros en vector suave -->
  <path d="M33 94c0-15.5 12-24 27-24s27 8.5 27 24c0 2.5-2 4-4.5 4H37.5c-2.5 0-4.5-1.5-4.5-4z" fill="${color}"/>
</svg>`)}`;

export const CARTOON_SAMUEL_AVATAR = createPersonVectorIcon('#0088ff');
export const CARTOON_KLEYDER_AVATAR = createPersonVectorIcon('#0088ff');
export const CARTOON_JOSE_AVATAR = createPersonVectorIcon('#0088ff');
export const CARTOON_ADMIN_AVATAR = createPersonVectorIcon('#0088ff');

// Alias descriptivos para coherencia semántica
export const PERSON_ICON_SAMUEL = CARTOON_SAMUEL_AVATAR;
export const PERSON_ICON_KLEYDER = CARTOON_KLEYDER_AVATAR;
export const PERSON_ICON_JOSE = CARTOON_JOSE_AVATAR;
export const PERSON_ICON_ADMIN = CARTOON_ADMIN_AVATAR;
