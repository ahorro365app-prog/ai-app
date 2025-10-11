"use client";

import { useState, useRef, useEffect } from "react";
import { Bot, User, Mic, Send, UtensilsCrossed, TrendingUp, Lightbulb, Target } from "lucide-react";

type Message = { role: "user" | "assistant"; content: string };

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    const nextMessages = [...messages, { role: "user", content: input }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply ?? "(sin respuesta)" }]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: "assistant", content: "Error de conexión" }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)]">
      {/* Header compacto */}
      <div className="border-b border-[#00B2FF]/10 bg-[#0B0F19]/80 backdrop-blur-xl px-4 py-3 animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00B2FF] to-[#5A00FF] flex items-center justify-center glow-primary">
            <Bot size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-[#E9EDF2]" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Asistente Financiero
            </h1>
            <p className="text-xs text-[#94A3B8]">
              Pregunta o registra gastos
            </p>
          </div>
        </div>
      </div>

      {/* Chat Container */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <div className="text-center py-8 animate-fade-in">
            <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-br from-[#00B2FF] to-[#5A00FF] flex items-center justify-center glow-primary">
              <Bot size={28} className="text-white" />
            </div>
            <h2 className="text-xl font-bold text-[#E9EDF2] mb-3" style={{ fontFamily: 'Poppins, sans-serif' }}>
              ¿Cómo puedo ayudarte?
            </h2>
            <p className="text-sm text-[#94A3B8] mb-6 px-4">
              Prueba preguntarme algo:
            </p>
            
            <div className="grid grid-cols-1 gap-2 max-w-sm mx-auto">
              {[
                { text: "Gasté B$ 50 en comida", Icon: UtensilsCrossed },
                { text: "¿Cuánto gasté esta semana?", Icon: TrendingUp },
                { text: "Dame consejos para ahorrar", Icon: Lightbulb },
                { text: "¿Cómo voy con mi presupuesto?", Icon: Target }
              ].map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => setInput(suggestion.text)}
                  className="p-3 rounded-xl bg-white/5 border border-[#00B2FF]/20 hover:bg-white/10 hover:border-[#00B2FF]/40 transition-all text-left group flex items-center gap-3"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00B2FF] to-[#5A00FF] flex items-center justify-center flex-shrink-0">
                    <suggestion.Icon size={16} className="text-white" />
                  </div>
                  <span className="text-xs text-[#94A3B8] group-hover:text-[#E9EDF2]">
                    {suggestion.text}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex gap-2 mb-4 animate-fade-in ${m.role === "user" ? "flex-row-reverse" : "flex-row"}`}
          >
            {/* Avatar */}
            <div className="flex-shrink-0">
              {m.role === "assistant" ? (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#5A00FF] to-[#00B2FF] flex items-center justify-center glow-secondary">
                  <Bot size={16} className="text-white" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00B2FF] to-[#5A00FF] flex items-center justify-center">
                  <User size={16} className="text-white" />
                </div>
              )}
            </div>

            {/* Message Bubble */}
            <div className={`flex-1 max-w-[75%] ${m.role === "user" ? "items-end" : "items-start"}`}>
              <div
                className={`
                  px-3 py-2 rounded-2xl text-sm leading-relaxed
                  ${m.role === "user"
                    ? "bg-gradient-to-br from-[#00B2FF] to-[#5A00FF] text-white ml-auto"
                    : "bg-white/10 border border-[#5A00FF]/30 text-[#E9EDF2] backdrop-blur-sm"
                  }
                `}
              >
                {m.content}
              </div>
              <div className={`text-[10px] text-[#94A3B8] mt-1 px-1 ${m.role === "user" ? "text-right" : "text-left"}`}>
                {m.role === "assistant" ? "IA" : "Tú"} • Ahora
              </div>
            </div>
          </div>
        ))}

        {/* Typing Indicator */}
        {loading && (
          <div className="flex gap-2 mb-4 animate-fade-in">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#5A00FF] to-[#00B2FF] flex items-center justify-center glow-secondary flex-shrink-0">
              <Bot size={16} className="text-white" />
            </div>
            <div className="bg-white/10 border border-[#5A00FF]/30 backdrop-blur-sm px-4 py-2 rounded-2xl">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-[#00B2FF] rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-[#5A00FF] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-[#00B2FF] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area - Compacto */}
      <div className="border-t border-[#00B2FF]/10 bg-[#0B0F19]/80 backdrop-blur-xl p-3">
        <form onSubmit={sendMessage}>
          <div className="flex gap-2 items-end">
            <div className="flex-1 relative">
              <textarea
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-[#00B2FF]/30 text-[#E9EDF2] text-sm placeholder-[#94A3B8] focus:outline-none focus:border-[#00B2FF] focus:ring-2 focus:ring-[#00B2FF]/20 transition-all resize-none"
                placeholder="Escribe tu mensaje..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage(e);
                  }
                }}
                rows={1}
                style={{ maxHeight: '80px', minHeight: '40px' }}
              />
            </div>

            {/* Voice Button */}
            <button
              type="button"
              className="p-2.5 rounded-xl bg-white/5 border border-[#5A00FF]/30 text-[#E9EDF2] hover:bg-white/10 transition-all flex-shrink-0"
              title="Grabar voz"
            >
              <Mic size={18} />
            </button>

            {/* Send Button */}
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="p-2.5 rounded-xl bg-gradient-to-r from-[#00B2FF] to-[#5A00FF] text-white hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed glow-primary flex-shrink-0"
            >
              <Send size={18} />
            </button>
          </div>

          <div className="mt-2 text-[10px] text-[#94A3B8] text-center">
            Presiona Enter para enviar • Shift + Enter para nueva línea
          </div>
        </form>
      </div>
    </div>
  );
}
