"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import { createStudySetFromAudio } from "@/lib/actions/study";
import { Button } from "@/components/ui/button";
import { Mic, Square, Upload, Loader2 } from "lucide-react";

const AUDIO_TYPES = ["audio/webm", "audio/mp4", "audio/mpeg", "audio/wav", "audio/ogg"];
const MAX_AUDIO_BYTES = 25 * 1024 * 1024;

export function StudyAudioTab() {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const busy = progress !== null;

  async function processAudio(blob: Blob, mimeType: string) {
    setProgress("Uploading...");
    try {
      const ext = mimeType.includes("webm") ? "webm" : mimeType.includes("mp4") ? "m4a" : mimeType.includes("wav") ? "wav" : "mp3";
      const file = new File([blob], `recording.${ext}`, { type: mimeType });
      const uploaded = await upload(file.name, file, { access: "public", handleUploadUrl: "/api/study-upload" });
      setProgress("Transcribing and generating notes...");
      const id = await createStudySetFromAudio({ title: "Recorded audio", blobUrl: uploaded.url, contentType: mimeType });
      router.push(`/study/${id}`);
    } catch (e) {
      setProgress(null);
      setError(e instanceof Error ? e.message : "Something went wrong");
    }
  }

  async function startRecording() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
        processAudio(blob, recorder.mimeType);
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);
      setSeconds(0);
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch {
      setError("Couldn't access your microphone — check your browser's permission for this site.");
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  }

  function handleFile(file: File) {
    if (!AUDIO_TYPES.includes(file.type)) {
      setError("Upload an audio file (mp3, wav, m4a, ogg, or webm).");
      return;
    }
    if (file.size > MAX_AUDIO_BYTES) {
      setError("That file is too large (25MB max).");
      return;
    }
    setError(null);
    processAudio(file, file.type);
  }

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant={recording ? "destructive" : "outline"}
          disabled={busy}
          onClick={recording ? stopRecording : startRecording}
        >
          {recording ? <Square className="size-4" /> : <Mic className="size-4" />}
          {recording ? `Stop (${mm}:${ss})` : "Record audio"}
        </Button>

        <span className="text-sm text-muted-foreground">or</span>

        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = "";
          }}
        />
        <Button type="button" variant="outline" disabled={busy || recording} onClick={() => fileInputRef.current?.click()}>
          <Upload className="size-4" /> Upload a file
        </Button>
      </div>

      {progress && (
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Loader2 className="size-3.5 animate-spin" /> {progress}
        </p>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
