"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import {
  createStudySetFromText,
  createStudySetFromLink,
  createStudySetFromDocument,
} from "@/lib/actions/study";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { StudyAudioTab } from "@/components/study-audio-tab";
import { FileText, Link2, Type, Upload, Loader2, Mic } from "lucide-react";

const DOC_TYPES: Record<string, string> = {
  "application/pdf": "PDF",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "Word doc",
  "text/plain": "text file",
  "text/markdown": "markdown file",
};
const MAX_DOC_BYTES = 25 * 1024 * 1024;

export function NewStudySetForm() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const busy = isPending || uploadProgress !== null;

  function handleDocument(file: File) {
    if (!(file.type in DOC_TYPES)) {
      setError("Upload a PDF, Word doc, or plain text/markdown file.");
      return;
    }
    if (file.size > MAX_DOC_BYTES) {
      setError("That file is too large (25MB max).");
      return;
    }
    setError(null);
    setUploadProgress("Uploading...");
    startTransition(async () => {
      try {
        const blob = await upload(file.name, file, {
          access: "public",
          handleUploadUrl: "/api/study-upload",
        });
        setUploadProgress("Reading document and generating notes...");
        const id = await createStudySetFromDocument({
          title: file.name.replace(/\.[^.]+$/, ""),
          blobUrl: blob.url,
          contentType: file.type,
        });
        router.push(`/study/${id}`);
      } catch (e) {
        setUploadProgress(null);
        setError(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  }

  return (
    <Tabs defaultValue="text" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="text">
          <Type className="size-4" /> Paste text
        </TabsTrigger>
        <TabsTrigger value="document">
          <FileText className="size-4" /> Document
        </TabsTrigger>
        <TabsTrigger value="audio">
          <Mic className="size-4" /> Audio
        </TabsTrigger>
        <TabsTrigger value="website">
          <Link2 className="size-4" /> Link
        </TabsTrigger>
      </TabsList>

      <TabsContent value="text" className="mt-4">
        <form
          className="space-y-3"
          action={(formData) => {
            const title = String(formData.get("title") ?? "");
            const text = String(formData.get("text") ?? "");
            if (!text.trim()) return;
            setError(null);
            startTransition(async () => {
              try {
                const id = await createStudySetFromText({ title, text });
                router.push(`/study/${id}`);
              } catch (e) {
                setError(e instanceof Error ? e.message : "Something went wrong");
              }
            });
          }}
        >
          <div>
            <Label htmlFor="text-title">Title</Label>
            <Input id="text-title" name="title" placeholder="e.g. Chapter 4 — Cell Biology" disabled={busy} className="mt-1" />
          </div>
          <div>
            <Label htmlFor="text-body">Notes, an article, a transcript — anything</Label>
            <Textarea
              id="text-body"
              name="text"
              rows={8}
              placeholder="Paste your material here..."
              disabled={busy}
              className="mt-1"
            />
          </div>
          <Button type="submit" disabled={busy}>
            {busy && <Loader2 className="size-4 animate-spin" />}
            {busy ? "Generating notes..." : "Generate notes"}
          </Button>
        </form>
      </TabsContent>

      <TabsContent value="document" className="mt-4">
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Upload a PDF, Word doc, or text file (25MB max).</p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.txt,.md"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleDocument(file);
              e.target.value = "";
            }}
          />
          <Button type="button" variant="outline" disabled={busy} onClick={() => fileInputRef.current?.click()}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
            {uploadProgress ?? "Choose a file"}
          </Button>
        </div>
      </TabsContent>

      <TabsContent value="audio" className="mt-4">
        <StudyAudioTab />
      </TabsContent>

      <TabsContent value="website" className="mt-4">
        <form
          className="space-y-3"
          action={(formData) => {
            const url = String(formData.get("url") ?? "");
            if (!url.trim()) return;
            setError(null);
            startTransition(async () => {
              try {
                const id = await createStudySetFromLink(url.trim());
                router.push(`/study/${id}`);
              } catch (e) {
                setError(e instanceof Error ? e.message : "Something went wrong");
              }
            });
          }}
        >
          <div>
            <Label htmlFor="website-url">Article page or YouTube video URL</Label>
            <Input id="website-url" name="url" type="url" placeholder="https://..." disabled={busy} className="mt-1" />
            <p className="mt-1 text-xs text-muted-foreground">
              YouTube videos must be public. Processing a video can take a minute or two.
            </p>
          </div>
          <Button type="submit" disabled={busy}>
            {busy && <Loader2 className="size-4 animate-spin" />}
            {busy ? "Reading and generating notes..." : "Generate notes"}
          </Button>
        </form>
      </TabsContent>

      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
    </Tabs>
  );
}
