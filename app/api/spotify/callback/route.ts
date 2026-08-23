import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { exchangeSpotifyCode } from '@/lib/server/spotifyTokens';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const cookieStore = await cookies();
  const savedState = cookieStore.get('spotify_oauth_state')?.value;

  if (!code || !state || !savedState || state !== savedState) {
    return NextResponse.redirect(new URL('/?error=spotify_oauth', url.origin));
  }

  const redirectUri = process.env.SPOTIFY_REDIRECT_URI;
  if (!redirectUri) {
    return NextResponse.redirect(new URL('/?error=spotify_oauth', url.origin));
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL('/?error=spotify_oauth', url.origin));
  }

  try {
    const tokens = await exchangeSpotifyCode(code, redirectUri);
    if (!tokens.refresh_token) throw new Error('missing refresh token');

    const { error } = await supabase.from('spotify_tokens').upsert({
      user_id: user.id,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    });
    if (error) throw new Error(error.message);
  } catch {
    return NextResponse.redirect(new URL('/?error=spotify_oauth', url.origin));
  }

  const response = NextResponse.redirect(new URL('/#spotify', url.origin));
  response.cookies.delete('spotify_oauth_state');
  return response;
}
