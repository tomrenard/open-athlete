"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { uploadActivityFile } from "@/actions/upload.actions";
import { createManualActivity } from "@/actions/activity.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ActivityType, PrivacyLevel } from "@/types";

export default function UploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [activityType, setActivityType] = useState<ActivityType>("run");
  const [privacy, setPrivacy] = useState<PrivacyLevel>("followers");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const [manualName, setManualName] = useState("");
  const [manualType, setManualType] = useState<ActivityType>("run");
  const [manualDate, setManualDate] = useState(() =>
    new Date().toISOString().slice(0, 16)
  );
  const [manualDurationMinutes, setManualDurationMinutes] = useState("");
  const [manualDistanceKm, setManualDistanceKm] = useState("");
  const [manualElevationM, setManualElevationM] = useState("");
  const [manualDescription, setManualDescription] = useState("");
  const [manualPrivacy, setManualPrivacy] = useState<PrivacyLevel>("followers");
  const [isManualSubmitting, setIsManualSubmitting] = useState(false);
  const [manualError, setManualError] = useState<string | null>(null);

  function handleDrag(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (validateFile(droppedFile)) {
        setFile(droppedFile);
        if (!name) {
          setName(droppedFile.name.replace(/\.(fit|gpx)$/i, ""));
        }
      }
    }
  }

  function validateFile(f: File): boolean {
    const validExtensions = [".fit", ".gpx"];
    const ext = f.name.toLowerCase().slice(f.name.lastIndexOf("."));
    if (!validExtensions.includes(ext)) {
      setError("Please upload a .FIT or .GPX file");
      return false;
    }
    setError(null);
    return true;
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (validateFile(selectedFile)) {
        setFile(selectedFile);
        if (!name) {
          setName(selectedFile.name.replace(/\.(fit|gpx)$/i, ""));
        }
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("Please select a file to upload");
      return;
    }

    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("name", name || file.name.replace(/\.(fit|gpx)$/i, ""));
    formData.append("description", description);
    formData.append("type", activityType);
    formData.append("privacy", privacy);

    const result = await uploadActivityFile(formData);

    if (result.success && result.activityId) {
      router.push(`/activity/${result.activityId}`);
    } else {
      setError(result.error || "Failed to upload activity");
      setIsUploading(false);
    }
  }

  async function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    const durationMinutes = parseFloat(manualDurationMinutes);
    const distanceKm = parseFloat(manualDistanceKm);
    const elevationM = manualElevationM.trim()
      ? parseFloat(manualElevationM)
      : null;
    if (Number.isNaN(durationMinutes) || durationMinutes <= 0) {
      setManualError("Enter a valid duration (minutes)");
      return;
    }
    if (Number.isNaN(distanceKm) || distanceKm <= 0) {
      setManualError("Enter a valid distance (km)");
      return;
    }
    if (elevationM !== null && (Number.isNaN(elevationM) || elevationM < 0)) {
      setManualError("Enter a valid elevation (m)");
      return;
    }
    if (!manualName.trim()) {
      setManualError("Enter an activity name");
      return;
    }
    setManualError(null);
    setIsManualSubmitting(true);
    const result = await createManualActivity({
      name: manualName.trim(),
      type: manualType,
      description: manualDescription.trim() || null,
      privacy: manualPrivacy,
      startedAt: new Date(manualDate),
      elapsedTimeSeconds: Math.round(durationMinutes * 60),
      distanceMeters: distanceKm * 1000,
      elevationGainMeters: elevationM ?? undefined,
    });
    if (result.success && result.activityId) {
      router.push(`/activity/${result.activityId}`);
    } else {
      setManualError(result.error || "Failed to create activity");
      setIsManualSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-2xl">Add Activity</CardTitle>
          <CardDescription>
            Upload a file or log an activity manually
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="upload">Upload file</TabsTrigger>
              <TabsTrigger value="manual">Manual entry</TabsTrigger>
            </TabsList>
            <TabsContent value="upload">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                    dragActive
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".fit,.gpx"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  {file ? (
                    <div className="space-y-2">
                      <div className="w-12 h-12 mx-auto rounded-full bg-green-500/20 flex items-center justify-center">
                        <svg
                          className="w-6 h-6 text-green-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setFile(null);
                          if (fileInputRef.current) {
                            fileInputRef.current.value = "";
                          }
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="w-12 h-12 mx-auto rounded-full bg-muted flex items-center justify-center">
                        <svg
                          className="w-6 h-6 text-muted-foreground"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium">
                          Drag and drop your file here
                        </p>
                        <p className="text-sm text-muted-foreground">
                          or click to browse
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        className="btn-touch"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Select File
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        Supported formats: .FIT, .GPX
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Activity Name</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Morning Run"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="btn-touch"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description (optional)</Label>
                    <textarea
                      id="description"
                      placeholder="How did it feel?"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Activity Type</Label>
                      <div className="flex gap-2">
                        {(["run", "ride", "swim"] as ActivityType[]).map(
                          (type) => (
                            <Button
                              key={type}
                              type="button"
                              variant={
                                activityType === type ? "default" : "outline"
                              }
                              size="sm"
                              className="btn-touch flex-1 capitalize"
                              onClick={() => setActivityType(type)}
                            >
                              {type}
                            </Button>
                          )
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Privacy</Label>
                      <div className="flex gap-2">
                        {(
                          ["public", "followers", "private"] as PrivacyLevel[]
                        ).map((p) => (
                          <Button
                            key={p}
                            type="button"
                            variant={privacy === p ? "default" : "outline"}
                            size="sm"
                            className="btn-touch flex-1 capitalize text-xs"
                            onClick={() => setPrivacy(p)}
                          >
                            {p}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}

                <Button
                  type="submit"
                  className="w-full glass-button"
                  disabled={!file || isUploading}
                >
                  {isUploading ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      Uploading...
                    </>
                  ) : (
                    "Upload Activity"
                  )}
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="manual">
              <form onSubmit={handleManualSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="manual-name">Activity name</Label>
                  <Input
                    id="manual-name"
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    placeholder="Morning run"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="manual-description">
                    Description (optional)
                  </Label>
                  <textarea
                    id="manual-description"
                    value={manualDescription}
                    onChange={(e) => setManualDescription(e.target.value)}
                    placeholder="How did it feel?"
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <div className="flex gap-2">
                      {(["run", "ride", "swim"] as ActivityType[]).map((t) => (
                        <Button
                          key={t}
                          type="button"
                          variant={manualType === t ? "default" : "outline"}
                          size="sm"
                          className="flex-1 capitalize"
                          onClick={() => setManualType(t)}
                        >
                          {t}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Privacy</Label>
                    <div className="flex gap-2">
                      {(
                        ["public", "followers", "private"] as PrivacyLevel[]
                      ).map((p) => (
                        <Button
                          key={p}
                          type="button"
                          variant={manualPrivacy === p ? "default" : "outline"}
                          size="sm"
                          className="flex-1 capitalize text-xs"
                          onClick={() => setManualPrivacy(p)}
                        >
                          {p}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="manual-date">Date & time</Label>
                  <Input
                    id="manual-date"
                    type="datetime-local"
                    value={manualDate}
                    onChange={(e) => setManualDate(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="manual-duration">Duration (minutes)</Label>
                    <Input
                      id="manual-duration"
                      type="number"
                      min="0.1"
                      step="0.1"
                      value={manualDurationMinutes}
                      onChange={(e) => setManualDurationMinutes(e.target.value)}
                      placeholder="30"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="manual-distance">Distance (km)</Label>
                    <Input
                      id="manual-distance"
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={manualDistanceKm}
                      onChange={(e) => setManualDistanceKm(e.target.value)}
                      placeholder="5"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="manual-elevation">
                    Elevation gain (m, optional)
                  </Label>
                  <Input
                    id="manual-elevation"
                    type="number"
                    min="0"
                    step="1"
                    value={manualElevationM}
                    onChange={(e) => setManualElevationM(e.target.value)}
                    placeholder="50"
                  />
                </div>
                {manualError && (
                  <p className="text-sm text-destructive">{manualError}</p>
                )}
                <Button
                  type="submit"
                  className="w-full glass-button"
                  disabled={isManualSubmitting}
                >
                  {isManualSubmitting ? "Saving..." : "Add activity"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
