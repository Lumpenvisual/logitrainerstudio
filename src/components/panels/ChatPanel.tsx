import { useProjectStore } from '@/store/useProjectStore';
import { Send, Bot, User, X, Sparkles } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function ChatPanel() {
  const { chatMessages, addChatMessage, isChatOpen, toggleChat } = useProjectStore();
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [chatMessages]);

  const handleSend = () => {
    if (!input.trim()) return;
    addChatMessage({ role: 'user', content: input.trim() });
    const userMsg = input.trim();
    setInput('');

    // Simulate AI response
    setTimeout(() => {
      addChatMessage({
        role: 'assistant',
        content: `I understand you're asking about: "${userMsg}". As the Neural Assistant, I can help with script refinement, asset generation guidance, and creative direction. Connect me to Lovable Cloud with the Gemini API to enable full AI capabilities.`,
        sources: [{ title: 'LogiTrainer Docs', url: '#' }],
      });
    }, 1200);
  };

  if (!isChatOpen) return null;

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
            <p className="text-[10px] text-muted-foreground font-mono">gemini-3-pro-preview</p>
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
              {msg.content}
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-2 border-t border-border/50 pt-2">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Sources</span>
                  {msg.sources.map((s, i) => (
                    <div key={i} className="text-xs text-primary/70 hover:text-primary cursor-pointer">{s.title}</div>
                  ))}
                </div>
              )}
            </div>
            {msg.role === 'user' && (
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-secondary mt-1">
                <User className="h-3 w-3 text-muted-foreground" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="border-t border-border p-3">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask the Neural Assistant..."
            className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
