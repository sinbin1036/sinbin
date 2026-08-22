import { createSupabaseServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

function safeNextPath(value: string | null) {
  return value?.startsWith('/') && !value.startsWith('//') ? value : '/';
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const next = safeNextPath(url.searchParams.get('next'));

  if (!code) {
    return NextResponse.redirect(new URL('/?error=oauth_callback', url.origin));
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(new URL('/?error=oauth_callback', url.origin));
  }

  if (process.env.REQUIRE_ALLOWLIST === 'true') {
    const { data: allowed } = await supabase
      .from('allowed_users')
      .select('email')
      .maybeSingle();

    if (!allowed) {
      await supabase.auth.signOut();
      return NextResponse.redirect(new URL('/?error=unauthorized', url.origin));
    }
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
