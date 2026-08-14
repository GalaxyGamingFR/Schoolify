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

// A lightweight fetch of the watch page purely to read its <title> --
// YouTube's own caption-track endpoint (the previous approach here) started
// returning empty responses in testing, blocked by anti-bot protection that
// requires a browser-generated proof-of-origin token a plain server fetch
// can't produce. The actual transcript comes from Gemini's native YouTube
// URL understanding instead (see extractYouTubeVideo below), which handles
// the video itself rather than scraping captions.
export async function fetchYouTubeTitle(videoId: string): Promise<string> {
  try {
    const res = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; SchoolifyBot/1.0)", "Accept-Language": "en-US,en" },
    });
    const html = await res.text();
    const titleMatch = html.match(/"title":"((?:[^"\\]|\\.)*)"/);
    return titleMatch ? JSON.parse(`"${titleMatch[1]}"`) : `YouTube video ${videoId}`;
  } catch {
    return `YouTube video ${videoId}`;
  }
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
