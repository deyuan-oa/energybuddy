import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useChatContext } from '@/contexts/ChatContext';
import { X, Send, Trash2, Zap, ClipboardList, FileText, BookOpen, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ReactMarkdown from 'react-markdown';

export function ChatSidebar() {
  const { messages, isLoading, isOpen, setIsOpen, sendMessage, clearMessages } = useChatContext();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    setInput('');
    sendMessage(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && <div className="fixed inset-0 z-40 bg-black/30 lg:hidden" onClick={() => setIsOpen(false)} />}

      {/* Sidebar */}
      <div
        className={cn(
          'fixed right-0 top-0 z-50 flex h-full w-full flex-col border-l border-border bg-card transition-transform duration-300 sm:w-[420px]',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <Zap className="size-5 text-primary" />
            <span className="si-h4 text-foreground">Energy Coach</span>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={clearMessages} title="Clear chat">
              <Trash2 className="size-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
              <X className="size-4" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <Zap className="size-10 text-primary mb-3" />
              <p className="si-h4 text-foreground mb-2">Energy Coach</p>
              <p className="si-body text-muted-foreground mb-4">
                Ask me about KPIs, anomalies, investigation checklists, or corrective actions. I'm here to help you manage energy performance.
              </p>
              <div className="grid gap-2 w-full max-w-xs">
                {[
                  'Why is compressed air consumption high today?',
                  'Generate an investigation checklist for HVAC',
                  'Draft a corrective action for the peak demand exceedance',
                ].map((q) => (
                  <button
                    key={q}
                    className="rounded border border-border bg-secondary/50 px-3 py-2 si-caption text-left text-foreground hover:bg-accent transition-colors"
                    onClick={() => sendMessage(q)}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
              <div
                className={cn(
                  'rounded-lg px-4 py-3 max-w-[90%]',
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary/70 text-foreground'
                )}
              >
                {msg.role === 'assistant' ? (
                  <div className="space-y-2">
                    <div className="prose prose-sm max-w-none dark:prose-invert si-body [&_h1]:si-h3 [&_h2]:si-h4 [&_h3]:si-body [&_h3]:font-semibold [&_li]:si-body [&_p]:si-body">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                    {/* One-click output buttons — only on complete messages */}
                    {!isLoading || i < messages.length - 1 ? (
                      <div className="flex flex-wrap gap-1.5 pt-2 border-t border-border/50">
                        <ActionButton icon={ClipboardList} label="Create Action" />
                        <ActionButton icon={FileText} label="Add to Log" />
                        <ActionButton icon={BookOpen} label="Include in Report" />
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <p className="si-body">{msg.content}</p>
                )}
              </div>
            </div>
          ))}

          {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
            <div className="flex justify-start">
              <div className="rounded-lg bg-secondary/70 px-4 py-3">
                <Loader2 className="size-4 animate-spin text-primary" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-border p-4">
          <div className="flex gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask the Energy Coach..."
              className="flex-1 resize-none rounded border border-input bg-background px-3 py-2 si-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              rows={2}
              disabled={isLoading}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              size="icon"
              className="shrink-0 self-end"
            >
              <Send className="size-4" />
            </Button>
          </div>
          <p className="si-caption text-muted-foreground mt-2">
            Evidence-first • No control policy • ISO 50001 aligned
          </p>
        </div>
      </div>
    </>
  );
}

function ActionButton({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  const [clicked, setClicked] = useState(false);
  return (
    <button
      onClick={() => setClicked(true)}
      disabled={clicked}
      className={cn(
        'inline-flex items-center gap-1 rounded border px-2 py-1 si-caption transition-colors',
        clicked
          ? 'border-rag-green/30 bg-rag-green/10 text-rag-green cursor-default'
          : 'border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground'
      )}
    >
      <Icon className="size-3" />
      {clicked ? `✓ ${label}` : label}
    </button>
  );
}
