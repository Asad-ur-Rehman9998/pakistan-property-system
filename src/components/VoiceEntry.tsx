"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import { interpretVoice, type VoiceReply } from "@/lib/voice/respond";
import { canListen, listenOnce, speakText, stopSpeaking } from "@/lib/voice/speech";
import { IconMic } from "./icons";
import { cn } from "@/lib/cn";
import { track } from "@/lib/analytics/client";

export function VoiceEntry({ compact = false }: { compact?: boolean }) {
  const { t, lang } = useI18n();
  const router = useRouter();
  const [text, setText] = useState("");
  const [listening, setListening] = useState(false);
  const [fromMic, setFromMic] = useState(false);
  const [error, setError] = useState("");
  const [reply, setReply] = useState<VoiceReply | null>(null);
  const [mic, setMic] = useState(false);

  useEffect(() => {
    setMic(canListen());
  }, []);

  const commit = (value: string, spoken: boolean) => {
    const next = value.trim();
    setText(value);
    setFromMic(spoken);
    setError("");
    if (!next) {
      setReply(null);
      return;
    }
    const result = interpretVoice(next, lang);
    setReply(result);
    if (spoken) speakText(result.spoken, lang);
  };

  const listen = async () => {
    if (listening) return;
    setError("");
    setListening(true);
    try {
      const said = await listenOnce(lang);
      if (said) {
        track("feature", { feature: "voice" });
        commit(said, true);
      }
    } catch {
      setError(t.voiceMicFail);
    } finally {
      setListening(false);
    }
  };

  const go = () => {
    if (!reply?.href) return;
    stopSpeaking();
    router.push(reply.href);
  };

  return (
    <section
      className={cn("panel p-4", compact && "p-3")}
      aria-label={t.voiceTitle}
    >
      <p className="text-xs font-semibold tracking-wide text-[var(--green)]">{t.voiceOptional}</p>
      <h2 className={cn("mt-1 font-semibold leading-snug", compact ? "text-lg" : "text-xl")}>{t.voiceTitle}</h2>
      <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{t.voiceH}</p>
      <p className="mt-1 text-xs leading-relaxed text-[var(--muted)]">{t.voiceNotChat}</p>

      <div className="mt-3 flex flex-col gap-2">
        <button
          type="button"
          className="btn-ghost w-full text-start text-sm leading-snug"
          onClick={() => commit(t.voiceExCheck, false)}
        >
          {t.voiceExCheck}
        </button>
        <button
          type="button"
          className="btn-ghost w-full text-start text-sm leading-snug"
          onClick={() => commit(t.voiceExToken, false)}
        >
          {t.voiceExToken}
        </button>
      </div>

      <textarea
        className="field mt-3 min-h-24"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setFromMic(false);
        }}
        placeholder={t.voicePh}
        aria-label={t.voiceTitle}
      />

      <div className="mt-3 flex gap-2">
        {mic ? (
          <button
            type="button"
            className={cn(
              "btn-ghost inline-flex flex-1 items-center justify-center gap-2",
              listening && "border-[var(--green)]",
            )}
            onClick={() => void listen()}
            aria-pressed={listening}
            aria-busy={listening}
          >
            <IconMic />
            {listening ? t.voiceStop : t.voice}
          </button>
        ) : (
          <p className="flex-1 self-center text-xs text-[var(--muted)]">{t.voiceNoMic}</p>
        )}
        <button type="button" className="btn-primary flex-[2]" onClick={() => commit(text, false)} disabled={!text.trim()}>
          {t.voiceGo}
        </button>
      </div>
      {error ? (
        <p className="mt-2 text-sm text-[var(--muted)]" role="alert">
          {error}
        </p>
      ) : null}

      {reply ? (
        <div className="mt-4 panel p-4" role="status" aria-live="polite">
          {fromMic && text ? (
            <p className="text-xs font-semibold text-[var(--muted)]">
              {t.voiceHeard}: {text}
            </p>
          ) : null}
          <h3 className="text-lg font-semibold leading-snug">{reply.title}</h3>
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed">{reply.body}</p>
          <div className="mt-4 flex gap-2">
            <button type="button" className="btn-ghost flex-1" onClick={() => speakText(reply.spoken, lang)}>
              {t.voiceListen}
            </button>
            {reply.href ? (
              <button type="button" className="btn-primary flex-[2]" onClick={go}>
                {reply.cta === "open_token" ? t.voiceOpenToken : reply.cta === "open_how" ? t.how : t.voiceStart}
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
