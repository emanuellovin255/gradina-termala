# Grădina Termală Dorobanți

Site de prezentare pentru ștrandul termal din Dorobanți, județul Arad.
Static, bilingv română / maghiară, fără backend.

## Pornire

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # genereaza dist/
npm run preview  # verifica build-ul local
```

## Ce modifici, unde

| Vrei să schimbi | Fișier |
|---|---|
| Preț, program, telefon, GPS, temperaturi | `src/content/shared.ts` |
| Orice text în română | `src/content/ro.json` |
| Orice text în maghiară | `src/content/hu.json` |
| Fotografii | `src/assets/photos/` (păstrează numele fișierelor) |
| Culori, tipografie, spațieri | `src/styles/tokens.css` |

Prețurile și programul se scriu **o singură dată**, în `shared.ts`, și apar automat
peste tot: în bara de sus, în tabelul de prețuri, în programul pe zile și în datele
structurate pe care le citește Google.

Cele două fișiere de traducere au aceleași chei. Dacă adaugi ceva în `ro.json`,
adaugă-l și în `hu.json`, altfel textul lipsește din versiunea maghiară.

## Structură

```
src/
  content/   shared.ts (date), ro.json, hu.json (texte), i18n.ts
  components/ Header, Hero, Bazine, ApaTermala, Facilitati,
              Preturi, Program, Galerie, Acces, Contact, Footer, Icon
  layouts/   Base.astro — <head>, SEO, JSON-LD
  pages/     index.astro (RO, la /), hu/index.astro (HU, la /hu/)
  scripts/   app.ts — meniu, temă, deschis/închis, galerie, reveal
  styles/    tokens.css, global.css
  assets/photos/
```

## Detalii care contează

**Deschis / închis** se calculează pe fusul orar al României (`Europe/Bucharest`),
nu pe cel al vizitatorului — cine deschide site-ul din Ungaria vede ora corectă.

**Datele structurate** (`JSON-LD`, tip `LocalBusiness` + `PublicSwimmingPool`) conțin
adresa, coordonatele, telefonul, programul și intervalul de preț. Astea sunt citite de
Google și de asistenții AI. Dacă se schimbă programul sau prețul în `shared.ts`,
se actualizează automat și aici.

**Fonturile** sunt găzduite local (`@fontsource-variable`), nu de la Google — pagina nu
face nicio cerere către servere terțe. Harta e un `iframe` OpenStreetMap, fără cookie-uri
de urmărire, deci site-ul nu are nevoie de banner de consimțământ.

**Tema** urmează setarea sistemului, iar comutatorul din header o suprascrie și
o ține minte în `localStorage`.

## Publicare

Configurat pentru Netlify (`netlify.toml`): build `npm run build`, publish `dist/`.
Merge la fel pe Vercel, Cloudflare Pages sau orice hosting static.

Înainte de publicare, schimbă `site` din `astro.config.mjs` dacă domeniul final
diferă de `https://gradinatermala.ro`. De el depind adresele canonice, `hreflang`-urile
și `sitemap.xml`.

## De confirmat cu proprietarul

Vezi [DATE-SURSA.md](DATE-SURSA.md) — prețurile 2026, datele exacte de sezon,
orarul autobuzului CTP, fotografiile originale și situația domeniului.
