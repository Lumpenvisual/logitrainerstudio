import { useProjectStore } from '@/store/useProjectStore';
import { useAPIStore } from '@/store/useAPIStore';
import { useI18n } from '@/i18n/useI18n';
import { Send, Bot, User, X, Sparkles } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { streamChat } from '@/services/aiService';
import { getModelById } from '@/services/apiRegistry';

export function ChatPanel() {
  const { chatMessages, addChatMessage, isChatOpen, toggleChat, addLog, scenes, brief } = useProjectStore();
  const { preferences, addCallLog } = useAPIStore();
  const { t } = useI18n();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [chatMessages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg = input.trim();
    addChatMessage({ role: 'user', content: userMsg });
    setInput('');
    setIsLoading(true);

    const model = preferences.chatAssistant;

    // Build context-aware system message
    const systemContext = [
      'You are the Neural Assistant for LogiTrainer AI Studio, a video production IDE.',
      brief ? `Current project brief: "${brief}"` : '',
      scenes.length > 0 ? `Project has ${scenes.length} scenes. Scene types: ${scenes.map(s => s.sceneType).join(', ')}.` : '',
      'Help with creative direction, script improvements, and production advice. Be concise and actionable.',
    ].filter(Boolean).join(' ');

    const allMessages = [
      { role: 'system', content: systemContext },
      ...chatMessages.map((m) => ({ role: m.role, content: m.content })),
      { role: 'user' as const, content: userMsg },
    ];

    let assistantContent = '';
    const start = performance.now();

    await streamChat({
      messages: allMessages,
      model,
      onDelta: (chunk) => {
        assistantContent += chunk;
        useProjectStore.setState((state) => {
          const msgs = [...state.chatMessages];
          const last = msgs[msgs.length - 1];
          if (last?.role === 'assistant') {
            msgs[msgs.length - 1] = { ...last, content: assistantContent };
          } else {
            msgs.push({ id: crypto.randomUUID(), role: 'assistant', content: assistantContent, timestamp: new Date() });
          }
          return { chatMessages: msgs };
        });
      },
      onDone: () => {
        setIsLoading(false);
        const latencyMs = Math.round(performance.now() - start);
        addCallLog({ function: 'ai-chat', model, status: 'success', latencyMs });
      },
      onError: (error) => {
        setIsLoading(false);
        addLog('error', `Chat error: ${error}`);
        addChatMessage({ role: 'assistant', content: `⚠️ Error: ${error}` });
        const latencyMs = Math.round(performance.now() - start);
        addCallLog({ function: 'ai-chat', model, status: 'error', latencyMs, error });
      },
    });
  };

  if (!isChatOpen) return null;

  const modelName = getModelById(preferences.chatAssistant)?.name || 'AI';

  return (
    <motion.div
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: 340, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="flex h-full flex-col border-l border-border bg-card/50 backdrop-blur-sm overflow-hidden"
    >
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/15">
            <Bot className="h-3.5 w-3.5 text-primary" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-foreground font-display">{t('chat.title')}</h3>
            <p className="text-[9px] text-muted-foreground/50 font-mono">{modelName}</p>
          </div>
        </div>
        <button onClick={toggleChat} className="rounded-md p-1 text-muted-foreground/50 hover:text-foreground hover:bg-secondary transition-colors">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-auto p-3 space-y-3">
        {chatMessages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <Sparkles className="h-8 w-8 text-primary/20 mb-3" />
            <p className="text-xs text-muted-foreground/60 leading-relaxed">{t('chat.empty')}</p>
            <p className="text-[10px] text-muted-foreground/30 mt-2 font-mono">{t('chat.powered')} {modelName}</p>
          </div>
        )}
        {chatMessages.map((msg) => (
          <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : ''}`}>
            {msg.role === 'assistant' && (
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-primary/15 mt-1">
                <Bot className="h-3 w-3 text-primary" />
              </div>
            )}
            <div
              className={`max-w-[85%] rounded-lg px-3 py-2 text-xs ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground rounded-br-sm'
                  : 'bg-secondary/50 text-secondary-foreground rounded-bl-sm'
              }`}
            >
              {msg.role === 'assistant' ? (
                <div className="prose prose-xs prose-invert max-w-none [&>p]:mb-1.5 [&>ul]:mb-1.5 [&>ol]:mb-1.5 [&>h1]:text-sm [&>h2]:text-xs [&>h3]:text-xs [&>code]:text-primary [&>pre]:bg-background [&>pre]:rounded [&>pre]:p-2 [&>blockquote]:border-primary/30 text-xs leading-relaxed">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              ) : (
                <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
              )}
            </div>
            {msg.role === 'user' && (
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-secondary mt-1">
                <User className="h-3 w-3 text-muted-foreground" />
              </div>
            )}
          </div>
        ))}
        {isLoading && chatMessages[chatMessages.length - 1]?.role !== 'assistant' && (
          <div className="flex gap-2">
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-primary/15 mt-1">
              <Bot className="h-3 w-3 text-primary" />
            </div>
            <div className="rounded-lg bg-secondary/50 px-3 py-2 rounded-bl-sm">
              <div className="flex gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 animate-pulse" />
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 animate-pulse" style={{ animationDelay: '0.15s' }} />
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 animate-pulse" style={{ animationDelay: '0.3s' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-border p-2.5">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder={t('chat.placeholder')}
            disabled={isLoading}
            className="flex-1 rounded-lg border border-border/50 bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/40 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/20 disabled:opacity-50 transition-all"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-all hover:brightness-110 disabled:opacity-40"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}