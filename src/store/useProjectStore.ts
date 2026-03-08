import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { temporal } from 'zundo';
import { v4 as uuid } from 'uuid';

export type ViewMode = 'architect' | 'studio' | 'timeline' | 'dashboard';
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
  track: 'video' | 'audio';
  startTime: number;
  duration: number;
  name?: string;
  opacity?: number;
  volume?: number;
}

export interface TimelineMarker {
  id: string;
  time: number;
  label: string;
  color: string;
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
        s.timeline = data.timeline || { clips: [], transitions: [], markers: [], playheadPosition: 0, zoom: 50, isPlaying: false, duration: 60 };
        if (!s.timeline.transitions) s.timeline.transitions = [];
        if (!s.timeline.markers) s.timeline.markers = [];
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
