import type { Scene as ClassicScene } from '@/types/project';
import type { Scene as StoreScene, Asset } from '@/store/useProjectStore';

function mapAssetStatus(
  storeStatus: string,
  url: string | null,
): ClassicScene['image']['status'] {
  if (url) return 'completed';
  if (storeStatus === 'generating') return 'generating';
  if (storeStatus === 'error') return 'error';
  return 'pending';
}

/** Convierte escenas del Studio Pro (Zustand) al formato del renderizador canvas. */
export function storeScenesToClassic(
  scenes: StoreScene[],
  assets: Record<string, Asset>,
): ClassicScene[] {
  return scenes.map((s) => {
    const imageUrl = s.assets.image ? assets[s.assets.image]?.url ?? null : null;
    const audioUrl = s.assets.audio ? assets[s.assets.audio]?.url ?? null : null;
    return {
      id: s.id,
      name: `Scene ${s.sceneNumber}`,
      script: s.voiceOverScript,
      image_prompt: s.visualPrompt,
      duration: Math.max(2, s.durationTargetSec),
      image: {
        status: mapAssetStatus(s.status.image, imageUrl),
        url: imageUrl,
      },
      audio: {
        status: mapAssetStatus(s.status.audio, audioUrl),
        url: audioUrl,
      },
      animation: { type: 'zoom_in', intensity: 0.3 },
      transition: 'fade',
      notes: '',
    };
  });
}

export function countScenesWithImages(scenes: ClassicScene[]): number {
  return scenes.filter((s) => s.image.url).length;
}
