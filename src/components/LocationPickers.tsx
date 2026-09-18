"use client";

import { useEffect, useMemo, useState } from "react";
import type { CheckAnswers } from "@/types/check";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import { useLowBandwidth } from "@/components/LowBwToggle";
import { BigChoice } from "@/components/BigChoice";
import { applyPlace, hasPickedPlace, osmMapUrl, searchPlaces, type PlaceHit } from "@/lib/pakistan/location";

export function PlaceSearch({
  answers,
  onChange,
}: {
  answers: CheckAnswers;
  onChange: (next: CheckAnswers) => void;
}) {
  const { t } = useI18n();
  const { on: lowBw } = useLowBandwidth();
  const [q, setQ] = useState(answers.locationLabel);
  const [remote, setRemote] = useState<PlaceHit[]>([]);
  const local = useMemo(() => searchPlaces(q), [q]);

  useEffect(() => {
    if (lowBw || q.trim().length < 3) {
      setRemote([]);
      return;
    }
    const ctrl = new AbortController();
    const timer = setTimeout(() => {
      fetch(`/api/geo/search?q=${encodeURIComponent(q.trim())}`, { signal: ctrl.signal })
        .then((r) => (r.ok ? r.json() : { hits: [] }))
        .then((body: { hits?: PlaceHit[] }) => setRemote(Array.isArray(body.hits) ? body.hits : []))
        .catch(() => setRemote([]));
    }, 400);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [q, lowBw]);

  const hits = useMemo(() => {
    const seen = new Set<string>();
    const out: PlaceHit[] = [];
    for (const hit of [...local, ...remote]) {
      if (seen.has(hit.id) || seen.has(hit.label)) continue;
      seen.add(hit.id);
      seen.add(hit.label);
      out.push(hit);
      if (out.length >= 8) break;
    }
    return out;
  }, [local, remote]);

  return (
    <>
      <input
        className="field"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={t.searchPh}
        autoComplete="off"
      />
      {hits.map((hit) => (
        <BigChoice
          key={hit.id}
          selected={answers.locationLabel === hit.label}
          onClick={() => onChange(applyPlace(answers, hit))}
          title={hit.label}
          hint={hit.kind}
        />
      ))}
      {q.trim() ? (
        <BigChoice
          selected={!hits.some((h) => h.label === answers.locationLabel) && answers.locationLabel === q.trim()}
          onClick={() =>
            onChange({
              ...answers,
              locationLabel: q.trim(),
              city: answers.city || q.trim(),
              area: answers.area || q.trim(),
            })
          }
          title={`${t.useTyped}: ${q.trim()}`}
        />
      ) : null}
      {hasPickedPlace(answers) ? (
        <p className="text-sm text-[var(--green-deep)]">{answers.locationLabel || answers.city}</p>
      ) : null}
    </>
  );
}

export function MapLocate({
  answers,
  onChange,
}: {
  answers: CheckAnswers;
  onChange: (next: CheckAnswers) => void;
}) {
  const { t } = useI18n();
  const { on: lowBw } = useLowBandwidth();
  const [err, setErr] = useState("");
  const [wait, setWait] = useState(false);

  const pin = answers.lat && answers.lng;

  const usePhone = () => {
    if (!navigator.geolocation) {
      setErr(t.geoNo);
      return;
    }
    setWait(true);
    setErr("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setWait(false);
        const lat = pos.coords.latitude.toFixed(5);
        const lng = pos.coords.longitude.toFixed(5);
        onChange({
          ...answers,
          locationMethod: "map",
          lat,
          lng,
          locationLabel: t.geoLabel,
        });
      },
      () => {
        setWait(false);
        setErr(t.geoFail);
      },
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 60_000 },
    );
  };

  return (
    <>
      <button type="button" className="btn-primary w-full" onClick={usePhone} disabled={wait}>
        {wait ? t.geoWait : t.geoUse}
      </button>
      {err ? <p className="text-sm text-[var(--red)]">{err}</p> : null}
      {pin ? (
        <>
          <p className="text-sm leading-relaxed">
            {t.geoPin}: {answers.lat}, {answers.lng}
          </p>
          <p className="text-sm text-[var(--muted)]">{t.geoNotPlot}</p>
          {lowBw ? null : (
            <a className="btn-ghost w-full" href={osmMapUrl(answers.lat, answers.lng)} target="_blank" rel="noreferrer">
              {t.openMap}
            </a>
          )}
        </>
      ) : (
        <p className="text-sm text-[var(--muted)]">{t.geoH}</p>
      )}
      <p className="mt-4 text-sm font-semibold">{t.searchOnMap}</p>
      <PlaceSearch answers={answers} onChange={onChange} />
    </>
  );
}
