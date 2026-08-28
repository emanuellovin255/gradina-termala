/* Tot JS-ul site-ului. Fara dependinte, ruleaza dupa parsarea documentului. */

type Interval = { deschis: number; inchis: number } | null;

interface HoursData {
  program: Interval[];
  zile: string[];
  inchis: string;
  deschisAcum: string;
  inchisAcum: string;
  panaLa: string;
  deschideLa: string;
  maine: string;
}

const fill = (tpl: string, vars: Record<string, string>) =>
  tpl.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m);

const hhmm = (h: number) => `${String(h).padStart(2, '0')}:00`;

/** Ora locala din Dorobanti, indiferent de fusul in care se afla vizitatorul. */
function acumInRomania(): { zi: number; ore: number; minute: number } {
  const f = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Bucharest',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const parts = Object.fromEntries(f.formatToParts(new Date()).map((p) => [p.type, p.value]));
  const zile: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return {
    zi: zile[parts.weekday as string] ?? new Date().getDay(),
    ore: Number(parts.hour) % 24,
    minute: Number(parts.minute),
  };
}

/* ---------- header lipit dupa scroll ---------- */

function initHeader(): void {
  const hdr = document.querySelector<HTMLElement>('[data-header]');
  if (!hdr) return;

  const sync = () => hdr.classList.toggle('is-stuck', window.scrollY > 40);
  sync();
  window.addEventListener('scroll', sync, { passive: true });
}

/* ---------- meniu mobil ---------- */

function initMeniu(): void {
  const btn = document.querySelector<HTMLButtonElement>('[data-menu-toggle]');
  const panou = document.querySelector<HTMLElement>('[data-menu]');
  if (!btn || !panou) return;

  const inchide = () => {
    btn.setAttribute('aria-expanded', 'false');
    panou.hidden = true;
  };

  btn.addEventListener('click', () => {
    const deschis = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', String(!deschis));
    panou.hidden = deschis;
  });

  panou.querySelectorAll('a').forEach((a) => a.addEventListener('click', inchide));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') inchide(); });
  window.addEventListener('resize', () => { if (window.innerWidth >= 1080) inchide(); });
}

/* ---------- comutator light / dark ---------- */

function initTema(): void {
  const btn = document.querySelector<HTMLButtonElement>('[data-theme-toggle]');
  if (!btn) return;

  btn.addEventListener('click', () => {
    const acum = document.documentElement.dataset.theme;
    const sistemE = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const curent = acum ?? sistemE;
    const urmator = curent === 'dark' ? 'light' : 'dark';

    document.documentElement.dataset.theme = urmator;
    try { localStorage.setItem('tema', urmator); } catch { /* mod privat */ }
  });
}

/* ---------- stare deschis / inchis + ziua curenta ---------- */

function initProgram(): void {
  const raw = document.querySelector<HTMLScriptElement>('[data-hours-data]');
  if (!raw?.textContent) return;

  const d: HoursData = JSON.parse(raw.textContent);
  const { zi, ore, minute } = acumInRomania();
  const azi = d.program[zi];
  const minuteAcum = ore * 60 + minute;

  const deschis =
    !!azi && minuteAcum >= azi.deschis * 60 && minuteAcum < azi.inchis * 60;

  /* insigna din hero */
  const badge = document.querySelector<HTMLElement>('[data-open-badge]');
  const text = document.querySelector<HTMLElement>('[data-open-text]');

  if (badge && text) {
    if (deschis && azi) {
      text.textContent = `${d.deschisAcum} · ${fill(d.panaLa, { ora: hhmm(azi.inchis) })}`;
    } else {
      // Cauta urmatoarea zi cu program, pornind de azi (daca nu s-a deschis inca).
      let pas = azi && minuteAcum < azi.deschis * 60 ? 0 : 1;
      while (pas < 8 && !d.program[(zi + pas) % 7]) pas += 1;

      const urm = d.program[(zi + pas) % 7];
      if (urm) {
        const numeZi = pas === 0 ? '' : pas === 1 ? d.maine : d.zile[(zi + pas) % 7].toLowerCase();
        const cand = fill(d.deschideLa, { zi: numeZi, ora: hhmm(urm.deschis) }).replace(/\s+/g, ' ').trim();
        text.textContent = `${d.inchisAcum} · ${cand}`;
      } else {
        text.textContent = d.inchisAcum;
      }
    }
    badge.classList.toggle('is-open', deschis);
    badge.hidden = false;
  }

  /* bara rapida: programul de azi */
  const azului = document.querySelector<HTMLElement>('[data-open-today]');
  if (azului) {
    azului.textContent = azi ? `${hhmm(azi.deschis)} – ${hhmm(azi.inchis)}` : d.inchis;
  }

  /* tabelul de program: evidentiaza randul de azi */
  document
    .querySelector<HTMLElement>(`.prog__r[data-day="${zi}"]`)
    ?.classList.add('is-today');
}

/* ---------- reveal la scroll ---------- */

function initReveal(): void {
  const tinte = document.querySelectorAll<HTMLElement>('[data-reveal]');
  if (!tinte.length) return;

  if (
    !('IntersectionObserver' in window) ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    tinte.forEach((el) => el.classList.add('is-visible'));
    return;
  }

  const obs = new IntersectionObserver(
    (intrari) => {
      intrari.forEach((i) => {
        if (!i.isIntersecting) return;
        i.target.classList.add('is-visible');
        obs.unobserve(i.target);
      });
    },
    { rootMargin: '0px 0px -12% 0px', threshold: 0.06 },
  );

  tinte.forEach((el) => obs.observe(el));
}

/* ---------- lightbox galerie ---------- */

function initGalerie(): void {
  const grid = document.querySelector<HTMLElement>('[data-gallery]');
  const lb = document.querySelector<HTMLElement>('[data-lightbox]');
  const raw = document.querySelector<HTMLScriptElement>('[data-gallery-data]');
  if (!grid || !lb || !raw?.textContent) return;

  const date: { contor: string; poze: { alt: string }[] } = JSON.parse(raw.textContent);
  const butoane = [...grid.querySelectorAll<HTMLButtonElement>('[data-gal-open]')];
  const img = lb.querySelector<HTMLImageElement>('[data-lb-img]');
  const cap = lb.querySelector<HTMLElement>('[data-lb-cap]');
  const contor = lb.querySelector<HTMLElement>('[data-lb-count]');
  if (!img || !cap || !contor) return;

  let index = 0;
  let declansator: HTMLElement | null = null;

  /** Cea mai mare varianta generata de Astro pentru miniatura respectiva. */
  const sursaMare = (b: HTMLButtonElement): string => {
    const el = b.querySelector('img');
    if (!el) return '';
    const set = el.getAttribute('srcset');
    if (!set) return el.src;
    const ultima = set.split(',').map((s) => s.trim()).pop();
    return ultima?.split(/\s+/)[0] ?? el.src;
  };

  const arata = (i: number) => {
    index = (i + butoane.length) % butoane.length;
    const alt = date.poze[index]?.alt ?? '';
    img.src = sursaMare(butoane[index]);
    img.alt = alt;
    cap.textContent = alt;
    contor.textContent = fill(date.contor, {
      n: String(index + 1),
      total: String(butoane.length),
    });
  };

  const deschide = (i: number, sursa: HTMLElement) => {
    declansator = sursa;
    arata(i);
    lb.hidden = false;
    document.body.style.overflow = 'hidden';
    lb.querySelector<HTMLButtonElement>('[data-lb-close]')?.focus();
  };

  const inchide = () => {
    lb.hidden = true;
    document.body.style.overflow = '';
    declansator?.focus();
    declansator = null;
  };

  butoane.forEach((b, i) => b.addEventListener('click', () => deschide(i, b)));
  lb.querySelectorAll('[data-lb-close]').forEach((el) => el.addEventListener('click', inchide));
  lb.querySelector('[data-lb-prev]')?.addEventListener('click', () => arata(index - 1));
  lb.querySelector('[data-lb-next]')?.addEventListener('click', () => arata(index + 1));

  document.addEventListener('keydown', (e) => {
    if (lb.hidden) return;
    if (e.key === 'Escape') inchide();
    if (e.key === 'ArrowLeft') arata(index - 1);
    if (e.key === 'ArrowRight') arata(index + 1);
    // Focusul ramane in dialog cat timp e deschis.
    if (e.key === 'Tab') {
      const focusabile = [...lb.querySelectorAll<HTMLElement>('button')];
      if (!focusabile.length) return;
      const primul = focusabile[0];
      const ultimul = focusabile[focusabile.length - 1];
      if (e.shiftKey && document.activeElement === primul) { e.preventDefault(); ultimul.focus(); }
      else if (!e.shiftKey && document.activeElement === ultimul) { e.preventDefault(); primul.focus(); }
    }
  });

  /* swipe pe telefon */
  let x0: number | null = null;
  lb.addEventListener('touchstart', (e) => { x0 = e.changedTouches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', (e) => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 55) arata(index + (dx < 0 ? 1 : -1));
    x0 = null;
  }, { passive: true });
}

/* ---------- pornire ---------- */

initHeader();
initMeniu();
initTema();
initProgram();
initReveal();
initGalerie();
