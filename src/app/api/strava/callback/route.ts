import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { exchangeCodeForTokens } from "@/lib/strava/client";

function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const baseUrl = getBaseUrl();

  if (error) {
    return NextResponse.redirect(
      `${baseUrl}/dashboard?error=strava_auth_denied`
    );
  }

  if (!code) {
    return NextResponse.redirect(
      `${baseUrl}/dashboard?error=strava_no_code`
    );
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(`${baseUrl}/login`);
    }

    const { tokens, athlete } = await exchangeCodeForTokens(code);

    await supabase.from("strava_tokens").upsert({
      user_id: user.id,
      athlete_id: tokens.athleteId,
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      expires_at: tokens.expiresAt.toISOString(),
      scope: "read,activity:read_all",
    });

    await supabase
      .from("profiles")
      .update({
        strava_athlete_id: tokens.athleteId,
        avatar_url: athlete.profile || undefined,
      })
      .eq("id", user.id);

    return NextResponse.redirect(
      `${baseUrl}/dashboard?success=strava_connected`
    );
  } catch (err) {
    console.error("Strava callback error:", err);
    return NextResponse.redirect(
      `${baseUrl}/dashboard?error=strava_callback_failed`
    );
  }
}
