/* Netlify Edge Function — parola pentru /admin.
   Acelasi rol ca middleware.ts de la Vercel: panoul e static, deci parola se
   verifica inaintea servirii fisierului. ADMIN_USER / ADMIN_PAROLA se seteaza in
   Netlify → Site configuration → Environment variables. Fara ADMIN_PAROLA, /admin da 404. */

// Globala oferita de runtime-ul Netlify (Deno). O declaram ca sa nu se planga TS.
declare const Netlify: { env: { get(cheie: string): string | undefined } };

// Doar ASCII: un antet HTTP cu diacritice sau em-dash e invalid si il arunca
// runtime-ul, iar fara WWW-Authenticate browserul nu mai deschide caseta de login.
const REALM = 'Panou Gradina Termala';

/** Comparatie in timp constant, ca sa nu se poata ghici parola caracter cu caracter. */
function egal(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let dif = 0;
  for (let i = 0; i < a.length; i++) dif |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return dif === 0;
}

/* Corpul se vede doar daca vizitatorul anuleaza caseta de login. */
const PAGINA_401 = `<!doctype html><html lang="ro"><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Autentificare necesara</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;
background:#F7F4EE;color:#0F252A;font:16px/1.6 system-ui,sans-serif;text-align:center}
p{color:#40565B;font-size:.9rem;margin:.6rem 0 0}</style>
<div><strong>Autentificare necesar&#259;</strong>
<p>Re&#238;ncarc&#259; pagina ca s&#259; apar&#259; caseta de autentificare.</p></div>`;

function ceremParola(): Response {
  return new Response(PAGINA_401, {
    status: 401,
    headers: {
      'WWW-Authenticate': `Basic realm="${REALM}", charset="UTF-8"`,
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

export default async (request: Request): Promise<Response | undefined> => {
  const parola = Netlify.env.get('ADMIN_PAROLA');
  const user = Netlify.env.get('ADMIN_USER') || 'admin';

  if (!parola) {
    return new Response('Not found', { status: 404, headers: { 'Cache-Control': 'no-store' } });
  }

  const antet = request.headers.get('authorization');
  if (!antet?.startsWith('Basic ')) return ceremParola();

  let trimis: string;
  try {
    trimis = atob(antet.slice(6));
  } catch {
    return ceremParola();
  }

  const i = trimis.indexOf(':');
  if (i < 0) return ceremParola();

  const okUser = egal(trimis.slice(0, i), user);
  const okParola = egal(trimis.slice(i + 1), parola);
  // Evaluam ambele inainte de decizie, ca raspunsul sa nu spuna care a gresit.
  if (!okUser || !okParola) return ceremParola();

  return undefined; // trece mai departe la fisierul static
};

export const config = { path: ['/admin', '/admin/*'] };
