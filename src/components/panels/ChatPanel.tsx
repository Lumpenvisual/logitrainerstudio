import { useProjectStore } from '@/store/useProjectStore';
import { useAPIStore } from '@/store/useAPIStore';
import { Send, Bot, User, X, Sparkles, Settings2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { streamChat } from '@/services/aiService';
import { getModelById } from '@/services/apiRegistry';

export function ChatPanel() {
  const { chatMessages, addChatMessage, isChatOpen, toggleChat, addLog } = useProjectStore();
  const { preferences, addCallLog } = useAPIStore();
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
    const allMessages = [...chatMessages, { role: 'user' as const, content: userMsg }].map((m) => ({
      role: m.role,
      content: m.content,
    }));

    let assistantContent = '';
    const start = performance.now();

    await streamChat({
      messages: allMessages,
      model,
      onDelta: (chunk) => {
        assistantContent += chunk;
        // Update the last message or create new
        useProjectStore.setState((state) => {
          const msgs = [...state.chatMessages];
          const last = msgs[msgs.length - 1];
          if (last?.role === 'assistant') {
            msgs[msgs.length - 1] = { ...last, content: assistantContent };
          } else {
            msgs.push({
              id: crypto.randomUUID(),
              role: 'assistant',
              content: assistantContent,
              timestamp: new Date(),
            });
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
      animate={{ width: 360, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      className="flex h-full flex-col border-l border-border bg-card overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/20">
            <Bot className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Neural Assistant</h3>
            <p className="text-[10px] text-muted-foreground font-mono">{modelName}</p>
          </div>
        </div>
        <button onClick={toggleChat} className="text-muted-foreground hover:text-foreground transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-auto p-4 space-y-4">
        {chatMessages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Sparkles className="h-8 w-8 text-primary/30 mb-3" />
            <p className="text-sm text-muted-foreground">Ask me about your project, script ideas, or creative direction.</p>
            <p className="text-xs text-muted-foreground/50 mt-1 font-mono">Powered by {modelName}</p>
          </div>
        )}
        {chatMessages.map((msg) => (
          <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : ''}`}>
            {msg.role === 'assistant' && (
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-primary/20 mt-1">
                <Bot className="h-3 w-3 text-primary" />
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-md px-3 py-2 text-sm ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground'
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.content}</div>
            </div>
            {msg.role === 'user' && (
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-secondary mt-1">
                <User className="h-3 w-3 text-muted-foreground" />
              </div>
            )}
          </div>
        ))}
        {isLoading && chatMessages[chatMessages.length - 1]?.role !== 'assistant' && (
          <div className="flex gap-2">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-primary/20 mt-1">
              <Bot className="h-3 w-3 text-primary" />
            </div>
            <div className="rounded-md bg-secondary px-3 py-2">
              <div className="flex gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-pulse" />
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-pulse delay-75" />
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-pulse delay-150" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-border p-3">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Ask the Neural Assistant..."
            disabled={isLoading}
            className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
