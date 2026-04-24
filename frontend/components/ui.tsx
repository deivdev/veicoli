"use client";

import { cn } from "@/lib/utils";
import { type InputHTMLAttributes, type LabelHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-slate-900 focus:outline-none",
        props.className
      )}
    />
  );
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        "w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-slate-900 focus:outline-none",
        props.className
      )}
    />
  );
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(
        "w-full rounded-lg border border-slate-300 px-3 py-2 bg-white focus:border-slate-900 focus:outline-none",
        props.className
      )}
    />
  );
}

export function Label(props: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      {...props}
      className={cn("block text-sm font-medium text-slate-700 mb-1", props.className)}
    />
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

export function Button({
  variant = "primary",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost";
}) {
  const styles = {
    primary: "bg-slate-900 text-white hover:bg-slate-800",
    secondary: "bg-white border border-slate-300 text-slate-900 hover:bg-slate-50",
    danger: "bg-crit text-white hover:opacity-90",
    ghost: "text-slate-600 hover:text-slate-900",
  }[variant];
  return (
    <button
      {...props}
      className={cn(
        "rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50",
        styles,
        className
      )}
    />
  );
}
