import type { Scene as StoreScene } from '@/store/useProjectStore';

function formatSRTTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.round((seconds % 1) * 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
}

export function generateSRTFromStoreScenes(scenes: StoreScene[]): string {
  let srt = '';
  let timeOffset = 0;
  let index = 1;
  for (const scene of scenes) {
    const text = scene.voiceOverScript?.trim();
    if (!text) continue;
    const start = timeOffset;
    const end = timeOffset + scene.durationTargetSec;
    srt += `${index}\n`;
    srt += `${formatSRTTime(start)} --> ${formatSRTTime(end)}\n`;
    srt += `${text}\n\n`;
    timeOffset = end;
    index++;
  }
  return srt.trim();
}

export function downloadTextFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
