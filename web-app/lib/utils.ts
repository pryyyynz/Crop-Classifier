import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format AI advice text to handle markdown-like formatting
export function formatAIText(text: string): string {
  if (!text) return text;

  return text
    // Handle bold text: **text** -> <strong>text</strong>
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    // Handle numbered lists: 1. -> proper formatting
    .replace(/^(\d+\.\s)/gm, "<br><strong>$1</strong>")
    // Handle bullet points: - or * at start of line
    .replace(/^[-*]\s/gm, "<br>• ")
    // Handle line breaks properly
    .replace(/\n\n/g, "<br><br>")
    .replace(/\n/g, "<br>")
    // Clean up any leading <br> tags
    .replace(/^<br>/, "");
}
