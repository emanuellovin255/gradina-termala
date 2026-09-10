/* Vercel Edge Middleware — parola pentru /admin.
   Panoul nu are backend, deci protectia se pune inaintea fisierului static.
   Utilizatorul si parola vin din variabilele de mediu ADMIN_USER / ADMIN_PAROLA,
   setate in Vercel → Settings → Environment Variables. Daca ADMIN_PAROLA lipseste,
   /admin raspunde 404: mai bine inaccesibil decat deschis din greseala. */

export const config = { matcher: ['/admin', '/admin/:path*'] };

const REALM = 'Gradina Termala — panou';

/** Comparatie in timp constant, ca sa nu se poata ghici parola caracter cu caracter. */
function egal(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let dif = 0;
  for (let i = 0; i < a.length; i++) dif |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return dif === 0;
}

function ceremParola(): Response {
  return new Response('Autentificare necesară.', {
    status: 401,
    headers: {
      'WWW-Authenticate': `Basic realm="${REALM}", charset="UTF-8"`,
      'Cache-Control': 'no-store',
    },
  });
}

export default function middleware(request: Request): Response | undefined {
  const parola = process.env.ADMIN_PAROLA;
  const user = process.env.ADMIN_USER || 'admin';

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
}
