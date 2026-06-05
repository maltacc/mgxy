export const colors = {
  bg: "#F2f4f7",
  surface: "#FFFFFF",
  board: "#FFFFFF",
  gridLine: "#d8dde8",
  cell: "#FFFFFF",
  cellGiven: "#eef0f6",
  cellHint: "rgba(108, 139, 255, 0.15)",
  cellError: "rgba(239, 68, 68, 0.14)",
  cellBorder: "#e8ecf3",
  badgeBg: "#ffffff",
  badgeText: "#6B7280",
  accent: "#f5A623",
  sun: "#f4b400",
  sunRay: "#e8a317",
  moon: "#9bc5d8",
  text: "#222838",
  subtle: "#8a93a6",
  button: "#ffffff",
  buttonText: "#3a4152",
  buttonActive: "#f5a623",
  success: "#22a565",
};

export function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (totalSeconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}
