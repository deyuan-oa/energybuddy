import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

type Message = { role: 'user' | 'assistant'; content: string };

interface ChatContextType {
  messages: Message[];
  isLoading: boolean;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  sendMessage: (input: string, context?: string) => Promise<void>;
  askAboutKpi: (kpiName: string, question: string, kpiContext: string) => void;
  clearMessages: () => void;
}

const ChatContext = createContext<ChatContextType | null>(null);

export function useChatContext() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChatContext must be used within ChatProvider');
  return ctx;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/energy-coach`;

export function ChatProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const sendMessage = useCallback(async (input: string, context?: string) => {
    const userMsg: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    let assistantSoFar = '';

    const upsertAssistant = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant') {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
        }
        return [...prev, { role: 'assistant', content: assistantSoFar }];
      });
    };

    try {
      const allMessages = [...messages, userMsg];
      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: allMessages.map(m => ({ role: m.role, content: m.content })),
          context,
        }),
      });

      if (!resp.ok || !resp.body) {
        const errorData = await resp.json().catch(() => ({ error: 'Failed to connect to Energy Coach' }));
        upsertAssistant(`⚠️ ${errorData.error || 'Failed to connect to Energy Coach'}`);
        setIsLoading(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') { streamDone = true; break; }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) upsertAssistant(content);
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      // Final flush
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split('\n')) {
          if (!raw) continue;
          if (raw.endsWith('\r')) raw = raw.slice(0, -1);
          if (raw.startsWith(':') || raw.trim() === '') continue;
          if (!raw.startsWith('data: ')) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === '[DONE]') continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) upsertAssistant(content);
          } catch { /* ignore */ }
        }
      }
    } catch (e) {
      console.error('Chat error:', e);
      upsertAssistant('⚠️ Connection error. Please try again.');
    }
    setIsLoading(false);
  }, [messages]);

  const askAboutKpi = useCallback((kpiName: string, question: string, kpiContext: string) => {
    setIsOpen(true);
    sendMessage(`${question} — regarding the "${kpiName}" KPI`, kpiContext);
  }, [sendMessage]);

  const clearMessages = useCallback(() => setMessages([]), []);

  return (
    <ChatContext.Provider value={{ messages, isLoading, isOpen, setIsOpen, sendMessage, askAboutKpi, clearMessages }}>
      {children}
    </ChatContext.Provider>
  );
}
