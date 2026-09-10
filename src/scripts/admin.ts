/* Panoul de administrare. Totul se intampla in browser: pornim de la valorile
   injectate la build, tinem o ciorna in localStorage si, la final, generam
   inapoi fisierele din src/content. Nimic nu pleaca spre vreun server. */

type Oricare = Record<string, any>;
type Magazie = 'date' | 'ro' | 'hu';

const FISIERE: Record<Magazie, string> = {
  date: 'date.json',
  ro: 'ro.json',
  hu: 'hu.json',
};

const CHEIE_CIORNA = 'admin-ciorna-v1';
const ZILE = ['Duminică', 'Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă'];

const brut = document.getElementById('ad-initial')?.textContent;
if (!brut) throw new Error('Lipsesc datele initiale.');

const INITIAL: Record<Magazie, Oricare> = JSON.parse(brut);
let ciorna: Record<Magazie, Oricare> = clona(INITIAL);

function clona<T>(o: T): T {
  return JSON.parse(JSON.stringify(o));
}

/* ---------- citire / scriere pe cale cu puncte ---------- */

function ia(obiect: Oricare, cale: string): any {
  return cale.split('.').reduce<any>((o, k) => (o == null ? undefined : o[k]), obiect);
}

function pune(obiect: Oricare, cale: string, valoare: unknown): void {
  const chei = cale.split('.');
  const ultima = chei.pop()!;
  const tinta = chei.reduce<Oricare>((o, k) => (o[k] ??= {}), obiect);
  tinta[ultima] = valoare;
}

/* ---------- ciorna in localStorage ---------- */

function incarcaCiorna(): void {
  try {
    const s = localStorage.getItem(CHEIE_CIORNA);
    if (!s) return;
    const salvat = JSON.parse(s);
    // Pornim de la initial si suprascriem, ca o cheie noua adaugata in cod
    // sa nu lipseasca dintr-o ciorna veche.
    (Object.keys(FISIERE) as Magazie[]).forEach((m) => {
      if (salvat[m]) ciorna[m] = { ...ciorna[m], ...salvat[m] };
    });
  } catch {
    /* ciorna coruptă — o ignorăm și pornim curat */
  }
}

function salveazaCiorna(areSchimbari: boolean): void {
  try {
    // Cand ciorna e identica cu ce e publicat, nu mai tinem nimic: o vizita
    // urmatoare porneste curat, nu de la o ciorna goala ramasa in urma.
    if (areSchimbari) localStorage.setItem(CHEIE_CIORNA, JSON.stringify(ciorna));
    else localStorage.removeItem(CHEIE_CIORNA);
  } catch {
    /* quota plina sau storage blocat — panoul merge si fara persistenta */
  }
}

/* ---------- ce s-a schimbat ---------- */

type Schimbare = { magazie: Magazie; cale: string; vechi: unknown; nou: unknown };

function schimbari(): Schimbare[] {
  const out: Schimbare[] = [];
  (Object.keys(FISIERE) as Magazie[]).forEach((m) => {
    compara(INITIAL[m], ciorna[m], m, '');
  });
  return out;

  function compara(a: any, b: any, m: Magazie, prefix: string): void {
    if (JSON.stringify(a) === JSON.stringify(b)) return;

    // Listele de ore se citesc mai bine intregi decat pozitie cu pozitie:
    // sterge o cursa si altfel ai vedea toate orele de dupa ea „schimbate”.
    if (!FRUNZE.has(prefix)) {
      if (Array.isArray(a) && Array.isArray(b)) {
        const n = Math.max(a.length, b.length);
        for (let i = 0; i < n; i++) compara(a[i], b[i], m, `${prefix}.${i}`);
        return;
      }
      if (esteObiect(a) && esteObiect(b)) {
        const chei = new Set([...Object.keys(a), ...Object.keys(b)]);
        chei.forEach((k) => compara(a[k], b[k], m, prefix ? `${prefix}.${k}` : k));
        return;
      }
    }

    out.push({ magazie: m, cale: prefix || '(rădăcină)', vechi: a, nou: b });
  }

  function esteObiect(v: unknown): v is Oricare {
    return typeof v === 'object' && v !== null && !Array.isArray(v);
  }
}

/** Cai comparate ca un tot, fara sa intram in ele. */
const FRUNZE = new Set(['autobuz.spre', 'autobuz.dinspre']);

const DIRECTII: Record<string, string> = {
  spre: 'Arad → Dorobanți',
  dinspre: 'Dorobanți → Arad',
};

/** Calea tehnica, tradusa in ceva ce se citeste in panou. */
function eticheta(cale: string): string {
  const zi = cale.match(/^program\.(\d)$/);
  if (zi) return `Program · ${ZILE[Number(zi[1])]}`;

  const bus = cale.match(/^autobuz\.(spre|dinspre)$/);
  if (bus) return `Autobuz · ${DIRECTII[bus[1]]}`;

  return cale;
}

/* ---------- elemente ---------- */

const $ = <T extends Element = HTMLElement>(sel: string) => document.querySelector(sel) as T | null;
const $$ = <T extends Element = HTMLElement>(sel: string) => Array.from(document.querySelectorAll(sel)) as T[];

const stare = $('#ad-stare')!;
const toast = $('#ad-toast')!;

/* ---------- taburi ---------- */

function aratTab(id: string): void {
  $$('[data-panou]').forEach((p) => {
    (p as HTMLElement).hidden = p.getAttribute('data-panou') !== id;
  });
  $$('[data-tab]').forEach((b) => {
    const activ = b.getAttribute('data-tab') === id;
    b.classList.toggle('is-active', activ);
    b.setAttribute('aria-current', String(activ));
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

$$('[data-tab]').forEach((b) => b.addEventListener('click', () => aratTab(b.getAttribute('data-tab')!)));
$$('[data-tab-jump]').forEach((b) =>
  b.addEventListener('click', () => aratTab(b.getAttribute('data-tab-jump')!)),
);

/* Fiecare tab isi are punctul lui de „aici s-a umblat”. */
const TAB_PENTRU_CALE: { tab: string; test: (m: Magazie, cale: string) => boolean }[] = [
  { tab: 'program', test: (m, c) => m === 'date' && c.startsWith('program') },
  { tab: 'preturi', test: (m, c) => m === 'date' && c.startsWith('preturi') },
  { tab: 'apa', test: (m, c) => m === 'date' && (c.startsWith('apa') || c.startsWith('bazinInot') || c.startsWith('suprafata')) },
  { tab: 'contact', test: (m, c) => m === 'date' && c.startsWith('contact') },
  { tab: 'locatie', test: (m, c) => m === 'date' && c.startsWith('locatie') },
  { tab: 'autobuz', test: (m, c) => m === 'date' && c.startsWith('autobuz') },
  { tab: 'texte', test: (m) => m === 'ro' || m === 'hu' },
];

/* ---------- campuri generice ---------- */

const campuri = $$<HTMLInputElement | HTMLTextAreaElement>('[data-path][data-store]');

function umpleCampuri(): void {
  campuri.forEach((el) => {
    const m = el.dataset.store as Magazie;
    const v = ia(ciorna[m], el.dataset.path!);
    el.value = v == null ? '' : String(v);
  });
}

campuri.forEach((el) => {
  el.addEventListener('input', () => {
    const m = el.dataset.store as Magazie;
    const cale = el.dataset.path!;
    const initialaVal = ia(INITIAL[m], cale);
    const numeric = el instanceof HTMLInputElement && el.type === 'number';
    let val: unknown = el.value;
    if (numeric) {
      const n = Number(el.value);
      val = el.value.trim() === '' || Number.isNaN(n) ? initialaVal : n;
    }
    pune(ciorna[m], cale, val);
    reimprospateaza();
  });
});

/* ---------- program ---------- */

function umpleProgram(): void {
  ciorna.date.program.forEach((zi: any, i: number) => {
    const rand = $(`[data-zi="${i}"]`);
    const open = $<HTMLSelectElement>(`[data-zi-open="${i}"]`);
    const close = $<HTMLSelectElement>(`[data-zi-close="${i}"]`);
    const inchis = $<HTMLInputElement>(`[data-zi-inchis="${i}"]`);
    if (!rand || !open || !close || !inchis) return;

    inchis.checked = zi === null;
    open.disabled = close.disabled = zi === null;
    if (zi) {
      open.value = String(zi.deschis);
      close.value = String(zi.inchis);
    }
    rand.classList.toggle('is-inchis', zi === null);

    const initialaZi = INITIAL.date.program[i];
    rand.classList.toggle('is-changed', JSON.stringify(initialaZi) !== JSON.stringify(zi));
  });
}

function scrieZi(i: number): void {
  const open = $<HTMLSelectElement>(`[data-zi-open="${i}"]`)!;
  const close = $<HTMLSelectElement>(`[data-zi-close="${i}"]`)!;
  const inchis = $<HTMLInputElement>(`[data-zi-inchis="${i}"]`)!;

  if (inchis.checked) {
    ciorna.date.program[i] = null;
  } else {
    let d = Number(open.value);
    let inc = Number(close.value);
    // Nu lasam un interval imposibil: inchiderea vine dupa deschidere.
    if (inc <= d) inc = Math.min(24, d + 1);
    close.value = String(inc);
    ciorna.date.program[i] = { deschis: d, inchis: inc };
  }
  umpleProgram();
  reimprospateaza();
}

for (let i = 0; i < 7; i++) {
  $(`[data-zi-open="${i}"]`)?.addEventListener('change', () => scrieZi(i));
  $(`[data-zi-close="${i}"]`)?.addEventListener('change', () => scrieZi(i));
  $(`[data-zi-inchis="${i}"]`)?.addEventListener('change', () => scrieZi(i));
}

$('#ad-bulk-apply')?.addEventListener('click', () => {
  const d = Number($<HTMLSelectElement>('#ad-bulk-open')!.value);
  let inc = Number($<HTMLSelectElement>('#ad-bulk-close')!.value);
  if (inc <= d) inc = Math.min(24, d + 1);
  ciorna.date.program = ciorna.date.program.map(() => ({ deschis: d, inchis: inc }));
  umpleProgram();
  reimprospateaza();
  arataToast(`Program pus pe ${hhmm(d)} – ${hhmm(inc)} în toate zilele`);
});

const hhmm = (h: number) => `${String(h).padStart(2, '0')}:00`;

/* Aceeasi logica de „deschis acum” ca pe site, ca previzualizarea sa nu minta. */
function previzualizare(): void {
  const acum = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Bucharest' }));
  const azi = ciorna.date.program[acum.getDay()];
  const minute = acum.getHours() * 60 + acum.getMinutes();
  const deschis = !!azi && minute >= azi.deschis * 60 && minute < azi.inchis * 60;

  const badge = $('#ad-badge')!;
  badge.textContent = deschis ? `Deschis acum · până la ${hhmm(azi.inchis)}` : 'Închis acum';
  badge.classList.toggle('is-open', deschis);
  $('#ad-preview-azi')!.textContent = azi
    ? `${ZILE[acum.getDay()]}: ${hhmm(azi.deschis)} – ${hhmm(azi.inchis)}`
    : `${ZILE[acum.getDay()]}: închis`;
}

/* ---------- autobuz ---------- */

function umpleAutobuz(): void {
  (['spre', 'dinspre'] as const).forEach((dir) => {
    const ul = $(`[data-lista="${dir}"]`);
    if (!ul) return;
    const ore: string[] = ciorna.date.autobuz[dir];
    ul.innerHTML = '';

    if (!ore.length) {
      const gol = document.createElement('li');
      gol.className = 'ad__gol';
      gol.textContent = 'Nicio cursă.';
      ul.appendChild(gol);
      return;
    }

    ore.forEach((ora, i) => {
      const li = document.createElement('li');
      li.className = 'ad__ora';

      const inp = document.createElement('input');
      inp.type = 'text';
      inp.value = ora;
      inp.placeholder = 'HH:MM';
      inp.setAttribute('aria-label', `Ora ${i + 1}`);
      inp.addEventListener('input', () => {
        ciorna.date.autobuz[dir][i] = inp.value;
        reimprospateaza();
      });

      const del = document.createElement('button');
      del.type = 'button';
      del.className = 'ad__del';
      del.textContent = '×';
      del.setAttribute('aria-label', `Șterge ora ${ora}`);
      del.addEventListener('click', () => {
        ciorna.date.autobuz[dir].splice(i, 1);
        umpleAutobuz();
        reimprospateaza();
      });

      li.append(inp, del);
      ul.appendChild(li);
    });
  });
}

$$('[data-add]').forEach((b) =>
  b.addEventListener('click', () => {
    const dir = b.getAttribute('data-add') as 'spre' | 'dinspre';
    ciorna.date.autobuz[dir].push('00:00');
    umpleAutobuz();
    reimprospateaza();
    ($(`[data-lista="${dir}"] .ad__ora:last-child input`) as HTMLInputElement | null)?.focus();
  }),
);

/* ---------- locatie derivata ---------- */

function umpleDerivate(): void {
  const { lat, lon } = ciorna.date.locatie;
  const g = $<HTMLAnchorElement>('#ad-lnk-gmaps')!;
  const w = $<HTMLAnchorElement>('#ad-lnk-waze')!;
  g.href = g.textContent = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;
  w.href = w.textContent = `https://waze.com/ul?ll=${lat},${lon}&navigate=yes`;
}

/* ---------- diferente si fisiere ---------- */

function scurt(v: unknown): string {
  if (v === null) return 'închis';
  if (v === undefined) return '—';
  if (Array.isArray(v)) return v.length ? v.join(', ') : '(gol)';
  if (typeof v === 'object' && 'deschis' in (v as Oricare)) {
    const zi = v as { deschis: number; inchis: number };
    return `${hhmm(zi.deschis)} – ${hhmm(zi.inchis)}`;
  }
  const s = typeof v === 'object' ? JSON.stringify(v) : String(v);
  return s.length > 120 ? `${s.slice(0, 117)}…` : s;
}

function umpleDiff(sch: Schimbare[]): void {
  const ul = $('#ad-diff')!;
  ul.innerHTML = '';

  if (!sch.length) {
    const li = document.createElement('li');
    li.className = 'ad__diffGol';
    li.textContent = 'Nimic încă.';
    ul.appendChild(li);
    return;
  }

  sch.forEach((s) => {
    const li = document.createElement('li');

    const cale = document.createElement('span');
    cale.className = 'ad__diffCale';
    cale.textContent = `${FISIERE[s.magazie]} · ${eticheta(s.cale)}`;

    const val = document.createElement('span');
    val.className = 'ad__diffVal';
    const vechi = document.createElement('span');
    vechi.className = 'ad__diffVechi';
    vechi.textContent = scurt(s.vechi);
    const nou = document.createElement('span');
    nou.className = 'ad__diffNou';
    nou.textContent = scurt(s.nou);
    val.append(vechi, document.createTextNode('  →  '), nou);

    li.append(cale, val);
    ul.appendChild(li);
  });
}

function continut(m: Magazie): string {
  return `${JSON.stringify(ciorna[m], null, 2)}\n`;
}

function descarca(m: Magazie): void {
  const blob = new Blob([continut(m)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = FISIERE[m];
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

async function copiaza(m: Magazie): Promise<void> {
  try {
    await navigator.clipboard.writeText(continut(m));
    arataToast(`${FISIERE[m]} copiat`);
  } catch {
    arataToast('Copierea a fost blocată de browser — folosește Descarcă');
  }
}

function umpleFisiere(sch: Schimbare[]): void {
  const ul = $('#ad-fisiere')!;
  ul.innerHTML = '';
  const atinse = (Object.keys(FISIERE) as Magazie[]).filter((m) => sch.some((s) => s.magazie === m));

  if (!atinse.length) {
    const li = document.createElement('li');
    li.className = 'ad__gol';
    li.textContent = 'Niciun fișier de descărcat — nu s-a schimbat nimic.';
    ul.appendChild(li);
    ($<HTMLButtonElement>('#ad-dl-all'))!.disabled = true;
    return;
  }
  ($<HTMLButtonElement>('#ad-dl-all'))!.disabled = false;

  atinse.forEach((m) => {
    const n = sch.filter((s) => s.magazie === m).length;
    const li = document.createElement('li');
    li.className = 'ad__fisier';

    const nume = document.createElement('span');
    nume.className = 'ad__fisierNume';
    nume.textContent = `src/content/${FISIERE[m]}`;

    const cnt = document.createElement('span');
    cnt.className = 'ad__fisierN';
    cnt.textContent = n === 1 ? '1 modificare' : `${n} modificări`;

    const btns = document.createElement('div');
    btns.className = 'ad__fisierBtns';

    const bDl = document.createElement('button');
    bDl.type = 'button';
    bDl.className = 'btn btn--ghost btn--sm';
    bDl.textContent = 'Descarcă';
    bDl.addEventListener('click', () => descarca(m));

    const bCp = document.createElement('button');
    bCp.type = 'button';
    bCp.className = 'btn btn--ghost btn--sm';
    bCp.textContent = 'Copiază';
    bCp.addEventListener('click', () => void copiaza(m));

    btns.append(bDl, bCp);
    li.append(nume, cnt, btns);
    ul.appendChild(li);
  });
}

$('#ad-dl-all')?.addEventListener('click', () => {
  const sch = schimbari();
  const atinse = (Object.keys(FISIERE) as Magazie[]).filter((m) => sch.some((s) => s.magazie === m));
  // Descarcari succesive: unele browsere le blocheaza daca vin in aceeasi bataie.
  atinse.forEach((m, i) => setTimeout(() => descarca(m), i * 350));
});

/* ---------- reset ---------- */

$('#ad-reset')?.addEventListener('click', () => {
  if (!schimbari().length) return;
  if (!confirm('Se pierd toate modificările nedescărcate. Continui?')) return;
  ciorna = clona(INITIAL);
  umpleTot(); // sterge si ciorna, prin salveazaCiorna(false)
  arataToast('Am revenit la valorile publicate');
});

/* ---------- toast ---------- */

let ceasToast: number | undefined;
function arataToast(mesaj: string): void {
  toast.textContent = mesaj;
  toast.hidden = false;
  window.clearTimeout(ceasToast);
  ceasToast = window.setTimeout(() => (toast.hidden = true), 2600);
}

/* ---------- refresh general ---------- */

function reimprospateaza(): void {
  const sch = schimbari();

  stare.textContent = !sch.length
    ? 'Fără modificări'
    : sch.length === 1
      ? '1 modificare nepublicată'
      : `${sch.length} modificări nepublicate`;
  stare.dataset.dirty = String(sch.length > 0);

  TAB_PENTRU_CALE.forEach(({ tab, test }) => {
    const punct = $(`[data-dot="${tab}"]`);
    if (punct) punct.hidden = !sch.some((s) => test(s.magazie, s.cale));
  });

  campuri.forEach((el) => {
    const m = el.dataset.store as Magazie;
    const cale = el.dataset.path!;
    el.classList.toggle('is-changed', JSON.stringify(ia(INITIAL[m], cale)) !== JSON.stringify(ia(ciorna[m], cale)));
  });

  $$('[data-moneda]').forEach((el) => (el.textContent = ciorna.date.preturi.moneda));

  previzualizare();
  umpleDerivate();
  umpleDiff(sch);
  umpleFisiere(sch);
  salveazaCiorna(sch.length > 0);
}

function umpleTot(): void {
  umpleCampuri();
  umpleProgram();
  umpleAutobuz();
  reimprospateaza();
}

incarcaCiorna();
umpleTot();

// Previzualizarea „deschis acum” se misca odata cu ceasul.
window.setInterval(previzualizare, 30_000);

window.addEventListener('beforeunload', (e) => {
  if (schimbari().length) e.preventDefault();
});
