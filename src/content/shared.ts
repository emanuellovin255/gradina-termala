// Date care nu se traduc — sursa unica de adevar pentru contact, coordonate, preturi si program.
// Modifici aici o singura data si se propaga in ambele limbi.

export const CONTACT = {
  telefon: '0726 671 972',
  telefonRaw: '+40726671972',
  email: 'dorobanti2014@gmail.com',
  facebook: 'https://www.facebook.com/Gradina.Termala/',
  instagram: 'https://www.instagram.com/gradina.termala/',
  whatsapp: 'https://wa.me/40726671972',
} as const;

export const LOCATIE = {
  localitate: 'Dorobanți',
  localitateHu: 'Kisiratos',
  judet: 'Arad',
  tara: 'România',
  codPostal: '315201',
  lat: 46.350867,
  lon: 21.246982,
  googleMaps: 'https://www.google.com/maps/dir/?api=1&destination=46.350867,21.246982',
  waze: 'https://waze.com/ul?ll=46.350867,21.246982&navigate=yes',
  osmEmbed:
    'https://www.openstreetmap.org/export/embed.html?bbox=21.2320%2C46.3440%2C21.2620%2C46.3580&layer=mapnik&marker=46.350867%2C21.246982',
} as const;

// Program pe zile. 0 = duminica ... 6 = sambata (indexare JS Date.getDay()).
// null = inchis. Orele sunt in ora locala a Romaniei.
export const PROGRAM: ReadonlyArray<{ deschis: number; inchis: number } | null> = [
  { deschis: 10, inchis: 23 }, // duminica
  { deschis: 12, inchis: 23 }, // luni
  { deschis: 10, inchis: 23 }, // marti
  { deschis: 10, inchis: 23 }, // miercuri
  { deschis: 10, inchis: 23 }, // joi
  { deschis: 10, inchis: 23 }, // vineri
  { deschis: 10, inchis: 23 }, // sambata
];

export const PRETURI = {
  adult: 35,
  pensionar: 25,
  copil: 15,
  sezlong: 15,
  moneda: 'lei',
} as const;

export const APA = {
  sursa: 55,
  tratamentMin: 36,
  tratamentMax: 40,
  copiiMin: 32,
  copiiMax: 36,
} as const;

export const BAZIN_INOT = { lungime: 30, latime: 10, adancimeMax: 2 } as const;

export const SUPRAFATA_HA = 1.5;

// Autobuz CTP Arad, plecare din statia Podgoria. De reconfirmat sezonier cu CTP.
export const AUTOBUZ = {
  spre: ['08:45', '15:40', '17:25'],
  dinspre: ['05:30', '10:00', '18:30'],
} as const;
