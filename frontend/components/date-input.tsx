"use client";

import { useEffect, useState } from "react";
import { isoToItDate, itDateToIso } from "@/lib/format";
import { Input } from "./ui";

type Props = {
  value: string;
  onChange: (iso: string) => void;
  required?: boolean;
};

/**
 * Campo data in formato italiano gg/mm/aaaa.
 * Gli input nativi type="date" seguono il locale del browser, non il lang della
 * pagina, quindi qui usiamo un campo testo con maschera e convertiamo in ISO.
 */
export function DateInput({ value, onChange, required }: Props) {
  const [text, setText] = useState(() => isoToItDate(value));

  // Risincronizza quando il valore arriva da fuori (apertura form in modifica,
  // reset dopo il salvataggio), ma non mentre l'utente sta digitando.
  useEffect(() => {
    setText((current) => (itDateToIso(current) === value ? current : isoToItDate(value)));
  }, [value]);

  function handleChange(raw: string) {
    // Solo cifre e slash, con gli slash inseriti automaticamente.
    const digits = raw.replace(/\D/g, "").slice(0, 8);
    let masked = digits;
    if (digits.length > 4) masked = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
    else if (digits.length > 2) masked = `${digits.slice(0, 2)}/${digits.slice(2)}`;
    setText(masked);
    onChange(itDateToIso(masked));
  }

  const incomplete = text.length > 0 && itDateToIso(text) === "";

  return (
    <Input
      type="text"
      inputMode="numeric"
      placeholder="gg/mm/aaaa"
      maxLength={10}
      required={required}
      value={text}
      onChange={(e) => handleChange(e.target.value)}
      aria-invalid={incomplete || undefined}
      className={incomplete ? "border-red-400" : undefined}
    />
  );
}
