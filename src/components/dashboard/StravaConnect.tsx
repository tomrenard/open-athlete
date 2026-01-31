"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getStravaConnectUrl,
  disconnectStrava,
  syncStravaActivities,
} from "@/actions/strava.actions";

interface StravaConnectProps {
  isConnected: boolean;
}

export function StravaConnect({ isConnected }: StravaConnectProps) {
  const [isPending, startTransition] = useTransition();
  const [syncResult, setSyncResult] = useState<{
    synced?: number;
    errors?: number;
  } | null>(null);

  async function handleConnect() {
    const url = await getStravaConnectUrl();
    window.location.href = url;
  }

  function handleDisconnect() {
    startTransition(async () => {
      await disconnectStrava();
      window.location.reload();
    });
  }

  function handleSync() {
    startTransition(async () => {
      setSyncResult(null);
      const result = await syncStravaActivities();
      if (result.success) {
        setSyncResult({ synced: result.synced, errors: result.errors });
      }
    });
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#FC4C02]/20 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-[#FC4C02]"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066l-2.084 4.116z" />
              <path d="M6.552 0L0 12.234h5.324l1.228-2.424 4.065-8.81L6.552 0zm6.262 0l3.065 6.05-1.228 2.424-4.065 8.81 4.065-8.81 1.228-2.424L13.62 0h-.806z" />
            </svg>
          </div>
          <div>
            <CardTitle className="text-lg">Strava</CardTitle>
            <CardDescription>
              {isConnected
                ? "Your Strava account is connected"
                : "Connect to sync your activities"}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isConnected ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-sm text-muted-foreground">Connected</span>
            </div>

            {syncResult && (
              <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                Synced {syncResult.synced} activities
                {syncResult.errors ? ` (${syncResult.errors} errors)` : ""}
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSync}
                disabled={isPending}
                className="flex-1"
              >
                {isPending ? "Syncing..." : "Sync Activities"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDisconnect}
                disabled={isPending}
                className="text-destructive hover:text-destructive"
              >
                Disconnect
              </Button>
            </div>
          </div>
        ) : (
          <Button
            onClick={handleConnect}
            disabled={isPending}
            className="w-full bg-[#FC4C02] hover:bg-[#FC4C02]/90"
          >
            <svg
              className="w-5 h-5 mr-2"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066l-2.084 4.116z" />
              <path d="M6.552 0L0 12.234h5.324l1.228-2.424 4.065-8.81L6.552 0zm6.262 0l3.065 6.05-1.228 2.424-4.065 8.81 4.065-8.81 1.228-2.424L13.62 0h-.806z" />
            </svg>
            Connect with Strava
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
