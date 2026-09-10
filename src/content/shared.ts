// Date care nu se traduc — sursa unica de adevar pentru contact, coordonate, preturi si program.
// Valorile stau in `date.json`, ca sa le poata scrie si panoul de administrare de la /admin.
// Aici doar le tipam si derivam ce se poate deriva (linkurile de harta din coordonate).

import date from './date.json';

export type Interval = { deschis: number; inchis: number };

export const CONTACT: {
  telefon: string;
  telefonRaw: string;
  email: string;
  facebook: string;
  instagram: string;
  whatsapp: string;
} = date.contact;

const { lat, lon } = date.locatie;

// Caseta hartii: ~1,7 km pe orizontala si ~1,5 km pe verticala in jurul strandului.
const dLon = 0.015;
const dLat = 0.007;
const bbox = [lon - dLon, lat - dLat, lon + dLon, lat + dLat]
  .map((n) => n.toFixed(4))
  .join('%2C');

export const LOCATIE = {
  ...date.locatie,
  googleMaps: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`,
  waze: `https://waze.com/ul?ll=${lat},${lon}&navigate=yes`,
  osmEmbed: `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lon}`,
};

// Program pe zile. 0 = duminica ... 6 = sambata (indexare JS Date.getDay()).
// null = inchis. Orele sunt in ora locala a Romaniei.
export const PROGRAM: ReadonlyArray<Interval | null> = date.program;

export const PRETURI: {
  adult: number;
  pensionar: number;
  copil: number;
  sezlong: number;
  moneda: string;
} = date.preturi;

export const APA: {
  sursa: number;
  tratamentMin: number;
  tratamentMax: number;
  copiiMin: number;
  copiiMax: number;
} = date.apa;

export const BAZIN_INOT: { lungime: number; latime: number; adancimeMax: number } = date.bazinInot;

export const SUPRAFATA_HA: number = date.suprafataHa;

// Autobuz CTP Arad, plecare din statia Podgoria. De reconfirmat sezonier cu CTP.
export const AUTOBUZ: { spre: readonly string[]; dinspre: readonly string[] } = date.autobuz;
