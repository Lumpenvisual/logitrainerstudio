// Multi-API provider registry and configuration

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  providerLabel: string;
  capabilities: ('text' | 'image-gen' | 'image-analysis' | 'audio' | 'video' | 'reasoning' | 'tts' | 'stt' | 'music')[];
  speed: 'fast' | 'balanced' | 'slow';
  quality: 'standard' | 'high' | 'premium';
  description: string;
  costTier: 'free-tier' | 'low' | 'medium' | 'high';
  maxTokens?: number;
}

export interface APIProvider {
  id: string;
  name: string;
  logo: string;
  color: string;
  status: 'active' | 'needs-key' | 'coming-soon';
  models: AIModel[];
  description: string;
  website: string;
  keyPlaceholder?: string;
  keyInstructions?: string;
  isBuiltIn: boolean; // true = Lovable AI (no user key needed)
}

// ─── BUILT-IN PROVIDERS (Lovable AI Gateway) ─────────────────────────
const GOOGLE_MODELS: AIModel[] = [
  {
    id: 'google/gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'google', providerLabel: 'Google',
    capabilities: ['text', 'image-analysis', 'reasoning'], speed: 'slow', quality: 'premium',
    description: 'Top-tier reasoning with image+text understanding. Best for complex analysis.',
    costTier: 'high', maxTokens: 65536,
  },
  {
    id: 'google/gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro', provider: 'google', providerLabel: 'Google',
    capabilities: ['text', 'reasoning'], speed: 'balanced', quality: 'premium',
    description: 'Latest next-gen reasoning model. Exceptional at complex tasks.', costTier: 'high',
  },
  {
    id: 'google/gemini-3-flash-preview', name: 'Gemini 3 Flash', provider: 'google', providerLabel: 'Google',
    capabilities: ['text', 'reasoning'], speed: 'fast', quality: 'high',
    description: 'Fast next-gen model. Great balance of speed and capability.', costTier: 'medium',
  },
  {
    id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'google', providerLabel: 'Google',
    capabilities: ['text', 'image-analysis', 'reasoning'], speed: 'fast', quality: 'high',
    description: 'Fast multimodal with good reasoning. Great default choice.', costTier: 'low',
  },
  {
    id: 'google/gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite', provider: 'google', providerLabel: 'Google',
    capabilities: ['text'], speed: 'fast', quality: 'standard',
    description: 'Fastest & cheapest. Good for simple tasks and classification.', costTier: 'free-tier',
  },
  {
    id: 'google/gemini-2.5-flash-image', name: 'Gemini Flash Image', provider: 'google', providerLabel: 'Google',
    capabilities: ['image-gen'], speed: 'fast', quality: 'high',
    description: 'Fast image generation from text prompts.', costTier: 'medium',
  },
  {
    id: 'google/gemini-3-pro-image-preview', name: 'Gemini 3 Pro Image', provider: 'google', providerLabel: 'Google',
    capabilities: ['image-gen'], speed: 'slow', quality: 'premium',
    description: 'Next-gen image generation. Higher quality, slower.', costTier: 'high',
  },
];

const OPENAI_MODELS: AIModel[] = [
  {
    id: 'openai/gpt-5', name: 'GPT-5', provider: 'openai', providerLabel: 'OpenAI',
    capabilities: ['text', 'image-analysis', 'reasoning'], speed: 'slow', quality: 'premium',
    description: 'Most powerful reasoning. Excellent accuracy for complex tasks.',
    costTier: 'high', maxTokens: 128000,
  },
  {
    id: 'openai/gpt-5.2', name: 'GPT-5.2', provider: 'openai', providerLabel: 'OpenAI',
    capabilities: ['text', 'reasoning'], speed: 'balanced', quality: 'premium',
    description: 'Enhanced reasoning. Best for complex problem-solving.', costTier: 'high',
  },
  {
    id: 'openai/gpt-5-mini', name: 'GPT-5 Mini', provider: 'openai', providerLabel: 'OpenAI',
    capabilities: ['text', 'image-analysis', 'reasoning'], speed: 'fast', quality: 'high',
    description: 'Great balance of speed and quality at lower cost.', costTier: 'medium',
  },
  {
    id: 'openai/gpt-5-nano', name: 'GPT-5 Nano', provider: 'openai', providerLabel: 'OpenAI',
    capabilities: ['text'], speed: 'fast', quality: 'standard',
    description: 'Ultra-fast and cheap. Best for high-volume simple tasks.', costTier: 'low',
  },
];

// ─── EXTERNAL PROVIDERS (User API Key Required) ──────────────────────
const RUNWAY_MODELS: AIModel[] = [
  {
    id: 'runway/gen-4', name: 'Gen-4', provider: 'runway', providerLabel: 'Runway',
    capabilities: ['video'], speed: 'slow', quality: 'premium',
    description: 'State-of-the-art AI video generation. Text/image to video.', costTier: 'high',
  },
  {
    id: 'runway/gen-3-alpha-turbo', name: 'Gen-3 Alpha Turbo', provider: 'runway', providerLabel: 'Runway',
    capabilities: ['video'], speed: 'balanced', quality: 'high',
    description: 'Faster video generation with great quality. 10s clips.', costTier: 'medium',
  },
];

const ELEVENLABS_MODELS: AIModel[] = [
  {
    id: 'elevenlabs/eleven-turbo-v2.5', name: 'Turbo v2.5', provider: 'elevenlabs', providerLabel: 'ElevenLabs',
    capabilities: ['tts'], speed: 'fast', quality: 'premium',
    description: 'Ultra-low latency voice synthesis. 32 languages.', costTier: 'medium',
  },
  {
    id: 'elevenlabs/eleven-multilingual-v2', name: 'Multilingual v2', provider: 'elevenlabs', providerLabel: 'ElevenLabs',
    capabilities: ['tts'], speed: 'balanced', quality: 'premium',
    description: 'Highest quality multilingual TTS. 29 languages.', costTier: 'medium',
  },
  {
    id: 'elevenlabs/scribe', name: 'Scribe STT', provider: 'elevenlabs', providerLabel: 'ElevenLabs',
    capabilities: ['stt'], speed: 'fast', quality: 'high',
    description: 'State-of-the-art speech-to-text transcription.', costTier: 'low',
  },
];

const STABILITY_MODELS: AIModel[] = [
  {
    id: 'stability/sd3.5-large', name: 'SD 3.5 Large', provider: 'stability', providerLabel: 'Stability AI',
    capabilities: ['image-gen'], speed: 'balanced', quality: 'premium',
    description: 'Latest Stable Diffusion. Photorealistic quality.', costTier: 'medium',
  },
  {
    id: 'stability/sd3.5-turbo', name: 'SD 3.5 Turbo', provider: 'stability', providerLabel: 'Stability AI',
    capabilities: ['image-gen'], speed: 'fast', quality: 'high',
    description: 'Fast high-quality image generation.', costTier: 'low',
  },
  {
    id: 'stability/stable-video', name: 'Stable Video Diffusion', provider: 'stability', providerLabel: 'Stability AI',
    capabilities: ['video'], speed: 'slow', quality: 'high',
    description: 'Image-to-video generation. Short clips from stills.', costTier: 'medium',
  },
];

const REPLICATE_MODELS: AIModel[] = [
  {
    id: 'replicate/flux-1.1-pro', name: 'FLUX 1.1 Pro', provider: 'replicate', providerLabel: 'Replicate',
    capabilities: ['image-gen'], speed: 'fast', quality: 'premium',
    description: 'Top-tier image generation by Black Forest Labs.', costTier: 'medium',
  },
  {
    id: 'replicate/musicgen-large', name: 'MusicGen Large', provider: 'replicate', providerLabel: 'Replicate',
    capabilities: ['music'], speed: 'balanced', quality: 'high',
    description: 'Meta AI music generation. Text-to-music.', costTier: 'medium',
  },
  {
    id: 'replicate/whisper-large-v3', name: 'Whisper Large v3', provider: 'replicate', providerLabel: 'Replicate',
    capabilities: ['stt'], speed: 'balanced', quality: 'premium',
    description: 'OpenAI Whisper on Replicate. Best-in-class STT.', costTier: 'low',
  },
];

const FAL_MODELS: AIModel[] = [
  {
    id: 'fal/kling-video', name: 'Kling Video', provider: 'fal', providerLabel: 'fal.ai',
    capabilities: ['video'], speed: 'slow', quality: 'premium',
    description: 'Kling video generation via fal. Cinematic quality.', costTier: 'high',
  },
  {
    id: 'fal/flux-pro', name: 'FLUX Pro', provider: 'fal', providerLabel: 'fal.ai',
    capabilities: ['image-gen'], speed: 'fast', quality: 'premium',
    description: 'FLUX image generation via fal infrastructure.', costTier: 'medium',
  },
  {
    id: 'fal/minimax-video', name: 'MiniMax Video', provider: 'fal', providerLabel: 'fal.ai',
    capabilities: ['video'], speed: 'balanced', quality: 'high',
    description: 'MiniMax video generation. Fast, high quality.', costTier: 'medium',
  },
];

const SUNO_MODELS: AIModel[] = [
  {
    id: 'suno/v4', name: 'Suno v4', provider: 'suno', providerLabel: 'Suno',
    capabilities: ['music'], speed: 'balanced', quality: 'premium',
    description: 'Industry-leading AI music generation. Full songs with vocals.', costTier: 'medium',
  },
];

const LUMAAI_MODELS: AIModel[] = [
  {
    id: 'luma/dream-machine', name: 'Dream Machine', provider: 'luma', providerLabel: 'Luma AI',
    capabilities: ['video'], speed: 'slow', quality: 'premium',
    description: 'High-fidelity video generation. Realistic motion & physics.', costTier: 'high',
  },
  {
    id: 'luma/photon', name: 'Photon', provider: 'luma', providerLabel: 'Luma AI',
    capabilities: ['image-gen'], speed: 'fast', quality: 'high',
    description: 'Fast, high-quality image generation.', costTier: 'medium',
  },
];

const ANTHROPIC_MODELS: AIModel[] = [
  {
    id: 'anthropic/claude-4-opus', name: 'Claude 4 Opus', provider: 'anthropic', providerLabel: 'Anthropic',
    capabilities: ['text', 'reasoning', 'image-analysis'], speed: 'slow', quality: 'premium',
    description: 'Most capable Claude. Exceptional at nuanced reasoning.', costTier: 'high',
  },
  {
    id: 'anthropic/claude-4-sonnet', name: 'Claude 4 Sonnet', provider: 'anthropic', providerLabel: 'Anthropic',
    capabilities: ['text', 'reasoning', 'image-analysis'], speed: 'balanced', quality: 'high',
    description: 'Best balance of intelligence and speed.', costTier: 'medium',
  },
  {
    id: 'anthropic/claude-4-haiku', name: 'Claude 4 Haiku', provider: 'anthropic', providerLabel: 'Anthropic',
    capabilities: ['text', 'reasoning'], speed: 'fast', quality: 'high',
    description: 'Fastest Claude. Great for real-time applications.', costTier: 'low',
  },
];

// ─── ALL PROVIDERS ───────────────────────────────────────────────────
export const AI_PROVIDERS: APIProvider[] = [
  {
    id: 'google', name: 'Google AI', logo: '🔷', color: 'text-blue-400',
    status: 'active', models: GOOGLE_MODELS, isBuiltIn: true,
    description: 'Gemini family — multimodal reasoning, image generation, fast inference',
    website: 'https://ai.google.dev',
  },
  {
    id: 'openai', name: 'OpenAI', logo: '🟢', color: 'text-emerald-400',
    status: 'active', models: OPENAI_MODELS, isBuiltIn: true,
    description: 'GPT-5 family — powerful reasoning, long context, multimodal',
    website: 'https://platform.openai.com',
  },
  {
    id: 'anthropic', name: 'Anthropic', logo: '🟤', color: 'text-orange-400',
    status: 'needs-key', models: ANTHROPIC_MODELS, isBuiltIn: false,
    description: 'Claude family — nuanced reasoning, safety-first, long context',
    website: 'https://console.anthropic.com',
    keyPlaceholder: 'sk-ant-...',
    keyInstructions: 'Go to console.anthropic.com → API Keys → Create Key',
  },
  {
    id: 'runway', name: 'Runway', logo: '🎬', color: 'text-violet-400',
    status: 'needs-key', models: RUNWAY_MODELS, isBuiltIn: false,
    description: 'Industry leader in AI video generation — Gen-4, Gen-3 Alpha',
    website: 'https://app.runwayml.com',
    keyPlaceholder: 'rw_...',
    keyInstructions: 'Go to app.runwayml.com → Settings → API Keys → Generate',
  },
  {
    id: 'elevenlabs', name: 'ElevenLabs', logo: '🔊', color: 'text-cyan-400',
    status: 'needs-key', models: ELEVENLABS_MODELS, isBuiltIn: false,
    description: 'Best-in-class AI voice synthesis & speech-to-text',
    website: 'https://elevenlabs.io',
    keyPlaceholder: 'el_...',
    keyInstructions: 'Go to elevenlabs.io → Profile → API Key',
  },
  {
    id: 'stability', name: 'Stability AI', logo: '🎨', color: 'text-purple-400',
    status: 'needs-key', models: STABILITY_MODELS, isBuiltIn: false,
    description: 'Stable Diffusion — photorealistic images & video from text',
    website: 'https://platform.stability.ai',
    keyPlaceholder: 'sk-...',
    keyInstructions: 'Go to platform.stability.ai → Account → API Keys',
  },
  {
    id: 'replicate', name: 'Replicate', logo: '🔁', color: 'text-yellow-400',
    status: 'needs-key', models: REPLICATE_MODELS, isBuiltIn: false,
    description: 'Run open-source models — FLUX, MusicGen, Whisper & more',
    website: 'https://replicate.com',
    keyPlaceholder: 'r8_...',
    keyInstructions: 'Go to replicate.com → Account → API tokens',
  },
  {
    id: 'fal', name: 'fal.ai', logo: '⚡', color: 'text-amber-400',
    status: 'needs-key', models: FAL_MODELS, isBuiltIn: false,
    description: 'Fast inference for video & image — Kling, FLUX, MiniMax',
    website: 'https://fal.ai',
    keyPlaceholder: 'fal_...',
    keyInstructions: 'Go to fal.ai → Dashboard → Keys → Create Key',
  },
  {
    id: 'luma', name: 'Luma AI', logo: '✨', color: 'text-pink-400',
    status: 'needs-key', models: LUMAAI_MODELS, isBuiltIn: false,
    description: 'Dream Machine — cinematic video & image generation',
    website: 'https://lumalabs.ai',
    keyPlaceholder: 'luma_...',
    keyInstructions: 'Go to lumalabs.ai → API → Generate Token',
  },
  {
    id: 'suno', name: 'Suno', logo: '🎵', color: 'text-rose-400',
    status: 'needs-key', models: SUNO_MODELS, isBuiltIn: false,
    description: 'AI music generation — full songs with vocals & instruments',
    website: 'https://suno.com',
    keyPlaceholder: 'suno_...',
    keyInstructions: 'Go to suno.com → Settings → API → Generate Key',
  },
];

// Default model selections per task
export interface ModelPreferences {
  scriptGeneration: string;
  chatAssistant: string;
  imageGeneration: string;
  imageAnalysis: string;
  imageEdit: string;
  videoGeneration: string;
  voiceSynthesis: string;
  musicGeneration: string;
  speechToText: string;
}

export const DEFAULT_PREFERENCES: ModelPreferences = {
  scriptGeneration: 'google/gemini-3-flash-preview',
  chatAssistant: 'google/gemini-3-flash-preview',
  imageGeneration: 'google/gemini-2.5-flash-image',
  imageAnalysis: 'google/gemini-2.5-flash',
  imageEdit: 'google/gemini-2.5-flash-image',
  videoGeneration: 'runway/gen-4',
  voiceSynthesis: 'elevenlabs/eleven-turbo-v2.5',
  musicGeneration: 'suno/v4',
  speechToText: 'elevenlabs/scribe',
};

export function getModelById(id: string): AIModel | undefined {
  for (const provider of AI_PROVIDERS) {
    const model = provider.models.find((m) => m.id === id);
    if (model) return model;
  }
  return undefined;
}

export function getModelsWithCapability(capability: AIModel['capabilities'][number]): AIModel[] {
  return AI_PROVIDERS.flatMap((p) => p.models.filter((m) => m.capabilities.includes(capability)));
}

export function getProviderById(id: string): APIProvider | undefined {
  return AI_PROVIDERS.find((p) => p.id === id);
}

export function getExternalProviders(): APIProvider[] {
  return AI_PROVIDERS.filter((p) => !p.isBuiltIn);
}

export function getBuiltInProviders(): APIProvider[] {
  return AI_PROVIDERS.filter((p) => p.isBuiltIn);
}
