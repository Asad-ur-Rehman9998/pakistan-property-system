import type { Lang } from "@/types/check";

type Rec = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((e: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

function RecognitionCtor(): (new () => Rec) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => Rec;
    webkitSpeechRecognition?: new () => Rec;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export function canListen(): boolean {
  return !!RecognitionCtor();
}

export function canSpeak(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function sttLang(lang: Lang): string {
  return lang === "ur" ? "ur-PK" : "en-PK";
}

export function listenOnce(lang: Lang): Promise<string> {
  const Ctor = RecognitionCtor();
  if (!Ctor) return Promise.reject(new Error("no-speech"));
  return new Promise((resolve, reject) => {
    const rec = new Ctor();
    let settled = false;
    const done = (fn: () => void) => {
      if (settled) return;
      settled = true;
      fn();
    };
    rec.lang = sttLang(lang);
    rec.interimResults = false;
    rec.continuous = false;
    rec.onresult = (e) => {
      const said = e.results[0]?.[0]?.transcript?.trim() || "";
      done(() => resolve(said));
    };
    rec.onerror = (e) => {
      done(() => reject(new Error(e.error || "speech-error")));
    };
    rec.onend = () => {
      done(() => resolve(""));
    };
    try {
      rec.start();
    } catch (err) {
      done(() => reject(err instanceof Error ? err : new Error("speech-start")));
    }
  });
}

export function speakText(text: string, lang: Lang) {
  if (!canSpeak() || !text.trim()) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = sttLang(lang);
  u.rate = 0.95;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}

export function stopSpeaking() {
  if (canSpeak()) window.speechSynthesis.cancel();
}
