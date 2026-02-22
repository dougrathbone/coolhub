import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function modeColor(mode: string): string {
  switch (mode) {
    case "cool":
      return "text-cyan-400";
    case "heat":
      return "text-orange-400";
    case "dry":
      return "text-amber-400";
    case "fan":
      return "text-emerald-400";
    case "auto":
      return "text-violet-400";
    default:
      return "text-slate-400";
  }
}

export function modeBgColor(mode: string): string {
  switch (mode) {
    case "cool":
      return "bg-cyan-500/10 border-cyan-500/30";
    case "heat":
      return "bg-orange-500/10 border-orange-500/30";
    case "dry":
      return "bg-amber-500/10 border-amber-500/30";
    case "fan":
      return "bg-emerald-500/10 border-emerald-500/30";
    case "auto":
      return "bg-violet-500/10 border-violet-500/30";
    default:
      return "bg-slate-500/10 border-slate-500/30";
  }
}

export function modeGradient(mode: string): string {
  switch (mode) {
    case "cool":
      return "from-cyan-500 to-blue-600";
    case "heat":
      return "from-orange-500 to-red-600";
    case "dry":
      return "from-amber-400 to-yellow-600";
    case "fan":
      return "from-emerald-500 to-green-600";
    case "auto":
      return "from-violet-500 to-purple-600";
    default:
      return "from-slate-500 to-slate-600";
  }
}

export function formatTemp(temp: number, unit: "celsius" | "imperial"): string {
  return `${temp.toFixed(1)}°${unit === "celsius" ? "C" : "F"}`;
}
