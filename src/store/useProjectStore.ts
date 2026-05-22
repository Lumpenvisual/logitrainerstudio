import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { temporal } from 'zundo';
import { v4 as uuid } from 'uuid';

export type ViewMode = 'architect' | 'studio' | 'timeline' | 'dashboard' | 'referrals' | 'marketing' | 'connectors' | 'scheduler' | 'email' | 'webhooks' | 'marketplace' | 'agents' | 'suite';
export type AssetType = 'image' | 'audio' | 'video';
export type AssetStatus = 'idle' | 'generating' | 'ready' | 'error';
export type LogLevel = 'info' | 'success' | 'error' | 'warning';
export type TransitionType = 'none' | 'fade' | 'dissolve' | 'wipe-left' | 'wipe-right' | 'wipe-up' | 'wipe-down' | 'zoom-in' | 'zoom-out' | 'slide-left' | 'slide-right';

export interface Scene {
  id: string;
  sceneNumber: number;
  sceneType: string;
  durationTargetSec: number;
  visualPrompt: string;
  voiceOverScript: string;
  status: { image: AssetStatus; audio: AssetStatus; video: AssetStatus };
  assets: { image?: string; audio?: string; video?: string };
}

export interface Asset {
  id: string;
  type: AssetType;
  url: string;
  duration: number;
  name: string;
}

export interface TimelineTransition {
  id: string;
  type: TransitionType;
  duration: number;
  fromClipId: string;
  toClipId: string;
}

export interface TimelineClip {
  id: string;
  assetId: string;
  track: string; // e.g. 'V1', 'V2', 'A1', 'A2'
  startTime: number;
  duration: number;
  name?: string;
  opacity?: number;
  volume?: number;
  speed?: number; // playback rate, 1.0 = normal
}

export interface TimelineMarker {
  id: string;
  time: number;
  label: string;
  color: string;
}

export interface TrackConfig {
  id: string;
  type: 'video' | 'audio';
  label: string;
  muted: boolean;
  locked: boolean;
  height: number;
}

export interface ProjectSettings {
  resolution: { width: number; height: number };
  fps: number;
  aspectRatio: string;
  sampleRate: number;
}

export interface TimelineState {
  clips: TimelineClip[];
  transitions: TimelineTransition[];
  markers: TimelineMarker[];
  tracks: TrackConfig[];
  playheadPosition: number;
  zoom: number;
  isPlaying: boolean;
  duration: number;
}

export interface LogEntry {
  id: string;
  level: LogLevel;
  message: string;
  timestamp: Date;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: { title: string; url: string }[];
  timestamp: Date;
}

const DEFAULT_TRACKS: TrackConfig[] = [
  { id: 'V1', type: 'video', label: 'V1', muted: false, locked: false, height: 64 },
  { id: 'V2', type: 'video', label: 'V2', muted: false, locked: false, height: 64 },
  { id: 'A1', type: 'audio', label: 'A1', muted: false, locked: false, height: 56 },
  { id: 'A2', type: 'audio', label: 'A2', muted: false, locked: false, height: 56 },
];

interface ProjectStore {
  projectTitle: string;
  setProjectTitle: (title: string) => void;

  currentView: ViewMode;
  setView: (view: ViewMode) => void;

  scenes: Scene[];
  addScenes: (scenes: Omit<Scene, 'id' | 'status' | 'assets'>[]) => void;
  updateScene: (id: string, updates: Partial<Scene>) => void;
  clearScenes: () => void;

  assets: Record<string, Asset>;
  addAsset: (asset: Omit<Asset, 'id'>) => string;

  timeline: TimelineState;
  setPlayhead: (pos: number) => void;
  setZoom: (zoom: number) => void;
  togglePlay: () => void;
  addClip: (clip: Omit<TimelineClip, 'id'>) => string;
  updateClip: (id: string, updates: Partial<Omit<TimelineClip, 'id'>>) => void;
  removeClip: (id: string) => void;
  duplicateClip: (id: string) => void;
  splitClip: (id: string, atTime: number) => void;

  addTrack: (type: 'video' | 'audio') => void;
  removeTrack: (trackId: string) => void;
  updateTrack: (trackId: string, updates: Partial<Omit<TrackConfig, 'id'>>) => void;

  addTransition: (transition: Omit<TimelineTransition, 'id'>) => void;
  updateTransition: (id: string, updates: Partial<Omit<TimelineTransition, 'id'>>) => void;
  removeTransition: (id: string) => void;
  getTransitionBetween: (clipAId: string, clipBId: string) => TimelineTransition | undefined;

  addMarker: (marker: Omit<TimelineMarker, 'id'>) => void;
  removeMarker: (id: string) => void;
  updateMarker: (id: string, updates: Partial<Omit<TimelineMarker, 'id'>>) => void;

  projectSettings: ProjectSettings;
  updateProjectSettings: (updates: Partial<ProjectSettings>) => void;

  logs: LogEntry[];
  addLog: (level: LogLevel, message: string) => void;
  clearLogs: () => void;

  chatMessages: ChatMessage[];
  addChatMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  clearChat: () => void;

  brief: string;
  setBrief: (brief: string) => void;
  isGeneratingScript: boolean;
  setGeneratingScript: (val: boolean) => void;

  isChatOpen: boolean;
  toggleChat: () => void;

  selectedClipId: string | null;
  setSelectedClipId: (id: string | null) => void;

  selectedTransitionId: string | null;
  setSelectedTransitionId: (id: string | null) => void;

  importProject: (data: { title: string; brief: string; scenes: any[]; timeline: any; assets: any }) => void;
}

export const useProjectStore = create<ProjectStore>()(
  temporal(
    immer((set, get) => ({
      projectTitle: 'Untitled Project',
      setProjectTitle: (title) => set((s) => { s.projectTitle = title; }),

      currentView: 'architect' as ViewMode,
      setView: (view) => set((s) => { s.currentView = view; }),

      scenes: [] as Scene[],
      addScenes: (newScenes) =>
        set((s) => {
          const mapped = newScenes.map((sc) => ({
            ...sc,
            id: uuid(),
            status: { image: 'idle' as const, audio: 'idle' as const, video: 'idle' as const },
            assets: {},
          }));
          s.scenes.push(...mapped);
        }),
      updateScene: (id, updates) =>
        set((s) => {
          const idx = s.scenes.findIndex((sc) => sc.id === id);
          if (idx !== -1) Object.assign(s.scenes[idx], updates);
        }),
      clearScenes: () => set((s) => { s.scenes = []; }),

      assets: {} as Record<string, Asset>,
      addAsset: (asset) => {
        const id = uuid();
        set((s) => { s.assets[id] = { ...asset, id }; });
        return id;
      },

      timeline: {
        clips: [],
        transitions: [],
        markers: [],
        tracks: [...DEFAULT_TRACKS],
        playheadPosition: 0,
        zoom: 50,
        isPlaying: false,
        duration: 60,
      } as TimelineState,
      setPlayhead: (pos) => set((s) => { s.timeline.playheadPosition = pos; }),
      setZoom: (zoom) => set((s) => { s.timeline.zoom = zoom; }),
      togglePlay: () => set((s) => { s.timeline.isPlaying = !s.timeline.isPlaying; }),
      addClip: (clip) => {
        const id = uuid();
        set((s) => { s.timeline.clips.push({ ...clip, id }); });
        return id;
      },
      updateClip: (id, updates) => set((s) => {
        const idx = s.timeline.clips.findIndex((c) => c.id === id);
        if (idx !== -1) Object.assign(s.timeline.clips[idx], updates);
      }),
      removeClip: (id) => set((s) => {
        s.timeline.clips = s.timeline.clips.filter((c) => c.id !== id);
        s.timeline.transitions = s.timeline.transitions.filter(
          (t) => t.fromClipId !== id && t.toClipId !== id
        );
      }),
      duplicateClip: (id) => set((s) => {
        const clip = s.timeline.clips.find((c) => c.id === id);
        if (clip) {
          s.timeline.clips.push({ ...clip, id: uuid(), startTime: clip.startTime + clip.duration });
        }
      }),
      splitClip: (id, atTime) => set((s) => {
        const clip = s.timeline.clips.find((c) => c.id === id);
        if (!clip) return;
        if (atTime <= clip.startTime || atTime >= clip.startTime + clip.duration) return;
        const firstDuration = atTime - clip.startTime;
        const secondDuration = clip.duration - firstDuration;
        clip.duration = firstDuration;
        s.timeline.clips.push({
          ...clip,
          id: uuid(),
          startTime: atTime,
          duration: secondDuration,
          name: clip.name ? `${clip.name} (2)` : undefined,
        });
      }),

      addTrack: (type) => set((s) => {
        const existing = s.timeline.tracks.filter(t => t.type === type);
        const num = existing.length + 1;
        const prefix = type === 'video' ? 'V' : 'A';
        const label = `${prefix}${num}`;
        const newTrack: TrackConfig = {
          id: label,
          type,
          label,
          muted: false,
          locked: false,
          height: type === 'video' ? 64 : 56,
        };
        // Insert video tracks before audio tracks, audio at end
        if (type === 'video') {
          let lastVideoIdx = -1;
          for (let i = s.timeline.tracks.length - 1; i >= 0; i--) {
            if (s.timeline.tracks[i].type === 'video') { lastVideoIdx = i; break; }
          }
          s.timeline.tracks.splice(lastVideoIdx + 1, 0, newTrack);
        } else {
          s.timeline.tracks.push(newTrack);
        }
      }),
      removeTrack: (trackId) => set((s) => {
        // Don't remove if it's the last track of its type
        const track = s.timeline.tracks.find(t => t.id === trackId);
        if (!track) return;
        const sameType = s.timeline.tracks.filter(t => t.type === track.type);
        if (sameType.length <= 1) return;
        s.timeline.tracks = s.timeline.tracks.filter(t => t.id !== trackId);
        s.timeline.clips = s.timeline.clips.filter(c => c.track !== trackId);
      }),
      updateTrack: (trackId, updates) => set((s) => {
        const idx = s.timeline.tracks.findIndex(t => t.id === trackId);
        if (idx !== -1) Object.assign(s.timeline.tracks[idx], updates);
      }),

      addTransition: (transition) => set((s) => {
        s.timeline.transitions = s.timeline.transitions.filter(
          (t) => !(t.fromClipId === transition.fromClipId && t.toClipId === transition.toClipId)
        );
        s.timeline.transitions.push({ ...transition, id: uuid() });
      }),
      updateTransition: (id, updates) => set((s) => {
        const idx = s.timeline.transitions.findIndex((t) => t.id === id);
        if (idx !== -1) Object.assign(s.timeline.transitions[idx], updates);
      }),
      removeTransition: (id) => set((s) => {
        s.timeline.transitions = s.timeline.transitions.filter((t) => t.id !== id);
      }),
      getTransitionBetween: (clipAId, clipBId) => {
        return get().timeline.transitions.find(
          (t) => t.fromClipId === clipAId && t.toClipId === clipBId
        );
      },

      addMarker: (marker) => set((s) => {
        s.timeline.markers.push({ ...marker, id: uuid() });
      }),
      removeMarker: (id) => set((s) => {
        s.timeline.markers = s.timeline.markers.filter((m) => m.id !== id);
      }),
      updateMarker: (id, updates) => set((s) => {
        const idx = s.timeline.markers.findIndex((m) => m.id === id);
        if (idx !== -1) Object.assign(s.timeline.markers[idx], updates);
      }),

      projectSettings: {
        resolution: { width: 1920, height: 1080 },
        fps: 30,
        aspectRatio: '16:9',
        sampleRate: 44100,
      } as ProjectSettings,
      updateProjectSettings: (updates) => set((s) => {
        Object.assign(s.projectSettings, updates);
      }),

      logs: [] as LogEntry[],
      addLog: (level, message) =>
        set((s) => {
          s.logs.unshift({ id: uuid(), level, message, timestamp: new Date() });
          if (s.logs.length > 100) s.logs.pop();
        }),
      clearLogs: () => set((s) => { s.logs = []; }),

      chatMessages: [] as ChatMessage[],
      addChatMessage: (msg) =>
        set((s) => {
          s.chatMessages.push({ ...msg, id: uuid(), timestamp: new Date() });
        }),
      clearChat: () => set((s) => { s.chatMessages = []; }),

      brief: '',
      setBrief: (brief) => set((s) => { s.brief = brief; }),
      isGeneratingScript: false,
      setGeneratingScript: (val) => set((s) => { s.isGeneratingScript = val; }),

      isChatOpen: false,
      toggleChat: () => set((s) => { s.isChatOpen = !s.isChatOpen; }),

      selectedClipId: null as string | null,
      setSelectedClipId: (id) => set((s) => { s.selectedClipId = id; s.selectedTransitionId = null; }),

      selectedTransitionId: null as string | null,
      setSelectedTransitionId: (id) => set((s) => { s.selectedTransitionId = id; s.selectedClipId = null; }),

      importProject: (data) => set((s) => {
        s.projectTitle = data.title || 'Imported Project';
        s.brief = data.brief || '';
        s.scenes = data.scenes || [];
        s.timeline = data.timeline || { clips: [], transitions: [], markers: [], tracks: [...DEFAULT_TRACKS], playheadPosition: 0, zoom: 50, isPlaying: false, duration: 60 };
        if (!s.timeline.transitions) s.timeline.transitions = [];
        if (!s.timeline.markers) s.timeline.markers = [];
        if (!s.timeline.tracks || s.timeline.tracks.length === 0) s.timeline.tracks = [...DEFAULT_TRACKS];
        s.assets = data.assets || {};
      }),
    })),
    {
      limit: 50,
      partialize: (state) => {
        const { scenes, timeline, assets, projectTitle, brief, projectSettings } = state;
        return { scenes, timeline, assets, projectTitle, brief, projectSettings };
      },
      equality: (pastState, currentState) =>
        JSON.stringify(pastState) === JSON.stringify(currentState),
    }
  )
);
