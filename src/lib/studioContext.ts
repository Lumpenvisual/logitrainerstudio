import type { ProjectSettings, Scene, TimelineState, ViewMode } from '@/store/useProjectStore';

export interface StudioContextInput {
  projectTitle: string;
  currentView: ViewMode;
  brief: string;
  scenes: Scene[];
  timeline: TimelineState;
  projectSettings: ProjectSettings;
  isGeneratingScript: boolean;
}

export function buildStudioSystemContext(input: StudioContextInput): string {
  const { projectTitle, currentView, brief, scenes, timeline, projectSettings, isGeneratingScript } = input;

  const sceneLines =
    scenes.length > 0
      ? scenes
          .map(
            (s) =>
              `- Scene ${s.sceneNumber} (${s.sceneType}, ${s.durationTargetSec}s): image=${s.status.image}, audio=${s.status.audio}, video=${s.status.video}`,
          )
          .join('\n')
      : '- No scenes yet.';

  return [
    'You are the Neural Assistant for LogiTrainer AI Studio, an automated audiovisual production IDE.',
    `Project: "${projectTitle}" | Active view: ${currentView}`,
    brief ? `Brief: ${brief}` : 'Brief: not set.',
    isGeneratingScript ? 'Script generation is in progress.' : `Scenes (${scenes.length}):\n${sceneLines}`,
    `Timeline: ${timeline.clips.length} clips, ${timeline.duration.toFixed(1)}s total, playhead at ${timeline.playheadPosition.toFixed(1)}s.`,
    `Output: ${projectSettings.resolution.width}x${projectSettings.resolution.height} @ ${projectSettings.fps}fps (${projectSettings.aspectRatio}).`,
    'Help with creative direction, scripts, visual prompts, timeline, and export. Match the user language when possible. Be concise and actionable.',
  ].join('\n');
}
