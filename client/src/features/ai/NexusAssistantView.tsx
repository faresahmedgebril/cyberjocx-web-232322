import { useRef, useState } from "react";
import { Bot, ChevronDown, Clock3, FileText, History, LoaderCircle, Paperclip, Plus, Send, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import { Streamdown } from "streamdown";
import { ComingSoonModal } from "@/components/ComingSoonModal";
import "./nexus-assistant.css";

type ChatMessage = { role: "assistant" | "user"; content: string };

const suggestedPrompts = [
  "Explain this security concept in simple steps",
  "Build a 30-day SOC learning roadmap",
  "Help me understand a CVE safely",
  "Quiz me on network fundamentals",
];

export default function NexusAssistantView({
  messages,
  input,
  setInput,
  onAsk,
  onNewChat,
  isLoading,
  isAuthenticated,
  onSignIn,
}: {
  messages: ChatMessage[];
  input: string;
  setInput: (value: string) => void;
  onAsk: () => void;
  onNewChat: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
  onSignIn: () => void;
}) {
  const [comingOpen, setComingOpen] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  function sendPrompt(prompt: string) {
    setInput(prompt);
    inputRef.current?.focus();
  }

  return (
    <section className="cj-nexus">
      <header className="cj-nexus-heading">
        <div className="cj-nexus-heading-icon"><Sparkles size={27} /></div>
        <div><span>// CYBERJOCX INTELLIGENCE</span><h2>AI Assistant</h2><p>Your cybersecurity agent for learning, research and secure practice.</p></div>
      </header>

      <div className="cj-nexus-layout">
        <section className="cj-nexus-chat">
          <header className="cj-nexus-chat-head">
            <div className="cj-nexus-orb"><Bot size={22} /></div>
            <div><strong>NEXUS Intelligence</strong><span><i /> Connected to CyberJocx knowledge</span></div>
            <div className="cj-nexus-chat-actions">
              <button type="button" aria-label="Chat history" onClick={() => setComingOpen(true)}><History size={17} /></button>
              <button type="button" aria-label="New chat" onClick={onNewChat}><Plus size={18} /></button>
            </div>
          </header>

          <div className="cj-nexus-messages" aria-live="polite">
            {messages.length === 0 ? (
              <div className="cj-nexus-welcome">
                <div className="cj-nexus-welcome-icon"><ShieldCheck size={26} /></div>
                <span className="cj-nexus-eyebrow">YOUR CYBERSECURITY COPILOT</span>
                <h3>What are we learning today?</h3>
                <p>Ask about security concepts, courses, tracks, malware research or CVEs. NEXUS uses the connected CyberJocx knowledge available to your account.</p>
                <div className="cj-nexus-prompts">
                  {suggestedPrompts.map(prompt => <button type="button" key={prompt} onClick={() => sendPrompt(prompt)}>{prompt}<ChevronDown size={14} /></button>)}
                </div>
              </div>
            ) : (
              <div className="cj-nexus-thread">
                <div className="cj-nexus-date"><span /> Current conversation <span /></div>
                {messages.map((message, index) => (
                  <article className={`cj-nexus-message ${message.role}`} key={`${message.role}-${index}`}>
                    <div className="cj-nexus-message-avatar">{message.role === "assistant" ? <Bot size={17} /> : <UserRound size={16} />}</div>
                    <div className="cj-nexus-message-content">
                      <span className="cj-nexus-message-role">{message.role === "assistant" ? "NEXUS" : "YOU"}</span>
                      <div className="cj-nexus-bubble">
                        {message.role === "assistant" ? <Streamdown>{message.content}</Streamdown> : message.content}
                      </div>
                    </div>
                  </article>
                ))}
                {isLoading && <div className="cj-nexus-thinking"><LoaderCircle size={16} /> NEXUS is preparing a response…</div>}
              </div>
            )}
          </div>

          <div className="cj-nexus-composer-wrap">
            <div className="cj-nexus-composer">
              <textarea
                ref={inputRef}
                value={input}
                onChange={event => setInput(event.target.value)}
                onKeyDown={event => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    onAsk();
                  }
                }}
                placeholder={isAuthenticated ? "Ask CyberJocx AI anything…" : "Sign in to start a conversation with NEXUS."}
                disabled={!isAuthenticated || isLoading}
                rows={2}
                maxLength={4000}
              />
              <div className="cj-nexus-composer-footer">
                <div><button type="button" aria-label="Attach file" onClick={() => setComingOpen(true)}><Paperclip size={17} /></button><span>Shift + Enter for a new line</span></div>
                {isAuthenticated ? (
                  <button type="button" className="cj-nexus-send" onClick={onAsk} disabled={!input.trim() || isLoading} aria-label="Send message">
                    {isLoading ? <LoaderCircle className="cj-nexus-spin" size={17} /> : <Send size={17} />}
                  </button>
                ) : <button type="button" className="cj-nexus-signin" onClick={onSignIn}>Sign in</button>}
              </div>
            </div>
            <p className="cj-nexus-disclaimer"><ShieldCheck size={13} /> AI can make mistakes. Verify important security information before acting on it.</p>
          </div>
        </section>

        <aside className="cj-nexus-side">
          <section className="cj-nexus-side-card">
            <div className="cj-nexus-side-title"><Sparkles size={17} /><strong>Knowledge Sources</strong></div>
            <div className="cj-nexus-source"><span className="cj-nexus-source-icon blue"><FileText size={17} /></span><div><b>Learning Library</b><small>Published courses and learning tracks</small></div><i>API</i></div>
            <div className="cj-nexus-source"><span className="cj-nexus-source-icon purple"><ShieldCheck size={17} /></span><div><b>Threat Intelligence</b><small>Indexed CVE and malware records</small></div><i>API</i></div>
            <div className="cj-nexus-source"><span className="cj-nexus-source-icon cyan"><Clock3 size={17} /></span><div><b>Your Learning Context</b><small>Current account and selected track</small></div><i>API</i></div>
          </section>

          <section className="cj-nexus-side-card cj-nexus-safety">
            <div className="cj-nexus-side-title"><ShieldCheck size={17} /><strong>Safe Use</strong></div>
            <p>Use NEXUS for authorized learning and defensive security work. Test only systems you own or have permission to assess.</p>
          </section>

          <section className="cj-nexus-side-card cj-nexus-tip">
            <Sparkles size={20} />
            <strong>Get better answers</strong>
            <p>Include the tool, version, error message and a short description of your authorized lab environment.</p>
          </section>
        </aside>
      </div>
      <ComingSoonModal open={comingOpen} onClose={() => setComingOpen(false)} />
    </section>
  );
}
