import "server-only";
import * as cheerio from "cheerio";
import { extractText, getDocumentProxy } from "unpdf";
import mammoth from "mammoth";

const MAX_CHARS = 60_000; // keeps ingestion cheap and inside the model's context comfortably

function truncate(text: string) {
  return text.length > MAX_CHARS ? text.slice(0, MAX_CHARS) + "\n\n[…truncated]" : text;
}

export async function extractWebsiteText(url: string): Promise<{ title: string; content: string }> {
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (compatible; SchoolifyBot/1.0)" } });
  if (!res.ok) throw new Error(`Couldn't fetch that URL (${res.status})`);
  const html = await res.text();

  const $ = cheerio.load(html);
  $("script, style, nav, footer, header, noscript, svg, iframe").remove();

  const title = $("title").first().text().trim() || url;
  const content = $("body").text().replace(/\s+\n/g, "\n").replace(/[ \t]+/g, " ").trim();

  if (!content) throw new Error("Couldn't find readable text on that page");
  return { title, content: truncate(content) };
}

export function youTubeVideoId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname === "youtu.be") return u.pathname.slice(1) || null;
    if (u.hostname.endsWith("youtube.com")) {
      if (u.pathname === "/watch") return u.searchParams.get("v");
      if (u.pathname.startsWith("/shorts/")) return u.pathname.split("/")[2] ?? null;
    }
    return null;
  } catch {
    return null;
  }
}

// Best-effort: YouTube has no official simple transcript API, so this reads
// the caption track list out of the watch page's embedded player response
// (the same data the page itself uses) and fetches one track's XML. This is
// unofficial and can break if YouTube changes that page's structure, or
// return nothing if the video has no captions at all -- callers should
// treat failure here as "ask the user to paste a transcript instead", not
// as a bug to retry.
export async function extractYouTubeTranscript(videoId: string): Promise<{ title: string; content: string }> {
  const res = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; SchoolifyBot/1.0)", "Accept-Language": "en-US,en" },
  });
  if (!res.ok) throw new Error("Couldn't reach YouTube for that video");
  const html = await res.text();

  const titleMatch = html.match(/"title":"((?:[^"\\]|\\.)*)"/);
  const title = titleMatch ? JSON.parse(`"${titleMatch[1]}"`) : `YouTube video ${videoId}`;

  const playerResponseMatch = html.match(/ytInitialPlayerResponse\s*=\s*(\{[\s\S]*?\});/);
  if (!playerResponseMatch) throw new Error("Couldn't find captions for this video");

  let tracks: { baseUrl: string; languageCode: string }[] = [];
  try {
    const playerResponse = JSON.parse(playerResponseMatch[1]);
    tracks = playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? [];
  } catch {
    throw new Error("Couldn't find captions for this video");
  }
  if (tracks.length === 0) throw new Error("This video doesn't have captions available");

  const track = tracks.find((t) => t.languageCode?.startsWith("en")) ?? tracks[0];
  const captionRes = await fetch(track.baseUrl);
  if (!captionRes.ok) throw new Error("Couldn't download the captions for this video");
  const xml = await captionRes.text();

  const $ = cheerio.load(xml, { xmlMode: true });
  const content = $("text")
    .map((_, el) => $(el).text())
    .get()
    .join(" ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();

  if (!content) throw new Error("This video's captions were empty");
  return { title, content: truncate(content) };
}

export async function extractDocumentText(fileUrl: string, contentType: string): Promise<string> {
  const res = await fetch(fileUrl);
  if (!res.ok) throw new Error("Couldn't download the uploaded file");
  const buffer = new Uint8Array(await res.arrayBuffer());

  if (contentType === "application/pdf") {
    const pdf = await getDocumentProxy(buffer);
    const { text } = await extractText(pdf, { mergePages: true });
    return truncate(text);
  }

  if (contentType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    const { value } = await mammoth.extractRawText({ buffer: Buffer.from(buffer) });
    return truncate(value);
  }

  // Plain text / markdown
  return truncate(new TextDecoder().decode(buffer));
}
