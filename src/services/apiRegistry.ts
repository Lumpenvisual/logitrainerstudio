// Multi-API provider registry and configuration

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  providerLabel: string;
  capabilities: ('text' | 'image-gen' | 'image-analysis' | 'audio' | 'video' | 'reasoning')[];
  speed: 'fast' | 'balanced' | 'slow';
  quality: 'standard' | 'high' | 'premium';
  description: string;
  costTier: 'free-tier' | 'low' | 'medium' | 'high';
  maxTokens?: number;
}

export interface APIProvider {
  id: string;
  name: string;
  logo: string; // emoji/icon identifier
  color: string; // tailwind color class
  status: 'active' | 'limited' | 'unavailable';
  models: AIModel[];
  description: string;
}

export const AI_PROVIDERS: APIProvider[] = [
  {
    id: 'google',
    name: 'Google AI',
    logo: '🔷',
    color: 'text-blue-400',
    status: 'active',
    description: 'Gemini family — multimodal reasoning, image generation, and fast inference',
    models: [
      {
        id: 'google/gemini-2.5-pro',
        name: 'Gemini 2.5 Pro',
        provider: 'google',
        providerLabel: 'Google',
        capabilities: ['text', 'image-analysis', 'reasoning'],
        speed: 'slow',
        quality: 'premium',
        description: 'Top-tier reasoning with image+text understanding. Best for complex analysis.',
        costTier: 'high',
        maxTokens: 65536,
      },
      {
        id: 'google/gemini-3.1-pro-preview',
        name: 'Gemini 3.1 Pro',
        provider: 'google',
        providerLabel: 'Google',
        capabilities: ['text', 'reasoning'],
        speed: 'balanced',
        quality: 'premium',
        description: 'Latest next-gen reasoning model. Exceptional at complex tasks.',
        costTier: 'high',
      },
      {
        id: 'google/gemini-3-flash-preview',
        name: 'Gemini 3 Flash',
        provider: 'google',
        providerLabel: 'Google',
        capabilities: ['text', 'reasoning'],
        speed: 'fast',
        quality: 'high',
        description: 'Fast next-gen model. Great balance of speed and capability.',
        costTier: 'medium',
      },
      {
        id: 'google/gemini-2.5-flash',
        name: 'Gemini 2.5 Flash',
        provider: 'google',
        providerLabel: 'Google',
        capabilities: ['text', 'image-analysis', 'reasoning'],
        speed: 'fast',
        quality: 'high',
        description: 'Fast multimodal with good reasoning. Great default choice.',
        costTier: 'low',
      },
      {
        id: 'google/gemini-2.5-flash-lite',
        name: 'Gemini 2.5 Flash Lite',
        provider: 'google',
        providerLabel: 'Google',
        capabilities: ['text'],
        speed: 'fast',
        quality: 'standard',
        description: 'Fastest & cheapest. Good for simple tasks and classification.',
        costTier: 'free-tier',
      },
      {
        id: 'google/gemini-2.5-flash-image',
        name: 'Nano Banana',
        provider: 'google',
        providerLabel: 'Google',
        capabilities: ['image-gen'],
        speed: 'fast',
        quality: 'high',
        description: 'Fast image generation from text prompts.',
        costTier: 'medium',
      },
      {
        id: 'google/gemini-3-pro-image-preview',
        name: 'Nano Banana Pro',
        provider: 'google',
        providerLabel: 'Google',
        capabilities: ['image-gen'],
        speed: 'slow',
        quality: 'premium',
        description: 'Next-gen image generation. Higher quality, slower.',
        costTier: 'high',
      },
    ],
  },
  {
    id: 'openai',
    name: 'OpenAI',
    logo: '🟢',
    color: 'text-emerald-400',
    status: 'active',
    description: 'GPT-5 family — powerful reasoning, long context, multimodal',
    models: [
      {
        id: 'openai/gpt-5',
        name: 'GPT-5',
        provider: 'openai',
        providerLabel: 'OpenAI',
        capabilities: ['text', 'image-analysis', 'reasoning'],
        speed: 'slow',
        quality: 'premium',
        description: 'Most powerful reasoning. Excellent accuracy for complex tasks.',
        costTier: 'high',
        maxTokens: 128000,
      },
      {
        id: 'openai/gpt-5.2',
        name: 'GPT-5.2',
        provider: 'openai',
        providerLabel: 'OpenAI',
        capabilities: ['text', 'reasoning'],
        speed: 'balanced',
        quality: 'premium',
        description: 'Enhanced reasoning. Best for complex problem-solving.',
        costTier: 'high',
      },
      {
        id: 'openai/gpt-5-mini',
        name: 'GPT-5 Mini',
        provider: 'openai',
        providerLabel: 'OpenAI',
        capabilities: ['text', 'image-analysis', 'reasoning'],
        speed: 'fast',
        quality: 'high',
        description: 'Great balance of speed and quality. Most tasks at lower cost.',
        costTier: 'medium',
      },
      {
        id: 'openai/gpt-5-nano',
        name: 'GPT-5 Nano',
        provider: 'openai',
        providerLabel: 'OpenAI',
        capabilities: ['text'],
        speed: 'fast',
        quality: 'standard',
        description: 'Ultra-fast and cheap. Best for high-volume simple tasks.',
        costTier: 'low',
      },
    ],
  },
];

// Default model selections per task
export interface ModelPreferences {
  scriptGeneration: string;
  chatAssistant: string;
  imageGeneration: string;
  imageAnalysis: string;
  imageEdit: string;
}

export const DEFAULT_PREFERENCES: ModelPreferences = {
  scriptGeneration: 'google/gemini-3-flash-preview',
  chatAssistant: 'google/gemini-3-flash-preview',
  imageGeneration: 'google/gemini-2.5-flash-image',
  imageAnalysis: 'google/gemini-2.5-flash',
  imageEdit: 'google/gemini-2.5-flash-image',
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
