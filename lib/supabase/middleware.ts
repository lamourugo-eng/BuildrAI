import { isAdminEmail } from '@/lib/admin';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return supabaseResponse;
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  if (!user && pathname.startsWith('/admin')) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/login';
    redirectUrl.searchParams.set('redirect', '/admin');
    return NextResponse.redirect(redirectUrl);
  }

  if (user && pathname.startsWith('/admin') && !isAdminEmail(user.email)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/espace';
    return NextResponse.redirect(redirectUrl);
  }

  if (!user && pathname.startsWith('/espace')) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/login';
    redirectUrl.searchParams.set('redirect', '/espace');
    return NextResponse.redirect(redirectUrl);
  }

  // Connexion requise uniquement pour finaliser un abonnement
  if (!user && pathname.startsWith('/subscribe')) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/login';
    redirectUrl.searchParams.set('redirect', '/subscribe');
    const plan = request.nextUrl.searchParams.get('plan');
    const period = request.nextUrl.searchParams.get('period');
    if (plan) redirectUrl.searchParams.set('plan', plan);
    if (period) redirectUrl.searchParams.set('period', period);
    return NextResponse.redirect(redirectUrl);
  }

  if (user && pathname === '/') {
    const quiz = request.nextUrl.searchParams.get('quiz');
    const landing = request.nextUrl.searchParams.get('landing');
    if (quiz !== '1' && landing !== '1') {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/espace';
      redirectUrl.search = '';
      return NextResponse.redirect(redirectUrl);
    }
  }

  if (pathname.startsWith('/auth/reset-password') || pathname.startsWith('/auth/callback')) {
    return supabaseResponse;
  }

  if (user && pathname === '/login') {
    const redirectUrl = request.nextUrl.clone();
    const target = request.nextUrl.searchParams.get('redirect') || '/espace';
    redirectUrl.pathname = target;
    redirectUrl.searchParams.delete('redirect');
    const plan = request.nextUrl.searchParams.get('plan');
    const period = request.nextUrl.searchParams.get('period');
    if (plan) redirectUrl.searchParams.set('plan', plan);
    if (period) redirectUrl.searchParams.set('period', period);
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}
