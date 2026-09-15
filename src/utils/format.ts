export const formatSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
};

export function convert12To24(timeStr: string): string {
  const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/i);
  if (!match) return timeStr;

  let [_, hoursStr, minutes, modifier] = match;
  let hours = parseInt(hoursStr, 10);

  if (modifier.toLowerCase() === "pm" && hours < 12) hours += 12;
  if (modifier.toLowerCase() === "am" && hours === 12) hours = 0;

  const hh = hours.toString().padStart(2, "0");
  return `${hh}:${minutes}`;
}
