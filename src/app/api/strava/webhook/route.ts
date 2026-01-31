import { NextResponse } from "next/server";
import { syncStravaActivity } from "@/lib/strava/sync";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.STRAVA_WEBHOOK_VERIFY_TOKEN) {
    console.log("Strava webhook verified");
    return NextResponse.json({ "hub.challenge": challenge });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

interface StravaWebhookEvent {
  object_type: "activity" | "athlete";
  object_id: number;
  aspect_type: "create" | "update" | "delete";
  owner_id: number;
  subscription_id: number;
  event_time: number;
  updates?: Record<string, unknown>;
}

export async function POST(request: Request) {
  try {
    const event: StravaWebhookEvent = await request.json();

    console.log("Strava webhook event:", event);

    if (event.object_type === "activity") {
      if (event.aspect_type === "create" || event.aspect_type === "update") {
        await syncStravaActivity(event.owner_id, event.object_id);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json({ received: true });
  }
}
