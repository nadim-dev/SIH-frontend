import { useEffect, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  Bot,
  Calculator,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  FileText,
  FlaskConical,
  LoaderCircle,
  MessageSquareText,
  Plus,
  Sparkles,
  Target,
} from "lucide-react";
import chatbotImage from "../assets/chatbot_image.png";
import { sendAssistantMessageApi } from "../api/assistantApi";

const suggestedQuestions = [
  { icon: FlaskConical, tone: "blue", text: "How is the tare test performed?" },
  {
    icon: Calculator,
    tone: "green",
    text: "What is the MPE for Class III at 50 kg?",
  },
  { icon: FileText, tone: "rose", text: "How does NAWI Pro guide me through instrument testing?" },
  {
    icon: Target,
    tone: "orange",
    text: "How is the eccentricity test performed?",
  },
  {
    icon: ClipboardList,
    tone: "indigo",
    text: "What should I do next in the NAWI Pro workflow?",
  },
];

const moreQuestions = [
  {
    icon: CheckSquare,
    tone: "green",
    text: "What should I check during the general examination?",
  },
  {
    icon: Calculator,
    tone: "blue",
    text: "What details do I need to calculate an MPE?",
  },
  {
    icon: MessageSquareText,
    tone: "rose",
    text: "What should I do if a test result fails?",
  },
];

const questionTone = {
  blue: "bg-blue-50 text-blue-600",
  green: "bg-emerald-50 text-emerald-600",
  rose: "bg-rose-50 text-rose-600",
  orange: "bg-orange-50 text-orange-600",
  indigo: "bg-indigo-50 text-indigo-600",
};

const welcomeMessage = {
  role: "assistant",
  content:
    "Hi! I’m NAWI Assistant. I can help you understand OIML R 76 requirements, testing procedures, MPE calculations, and the NAWI Pro workflow. Tell me which test or step you’re working on, and include the instrument class and readings when relevant.",
  content: "Hi! I’m NAWI Assistant. Ask me about OIML R 76 tests, MPE, or the NAWI Pro workflow.",
};

function MessageText({ text }) {
  const cleanText = String(text || "")
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/^\s*---+\s*$/gm, "")
    .replace(/\\\[/g, "")
    .replace(/\\\]/g, "")
    .replace(/\\text\{([^}]*)\}/g, "$1")
    .replace(/\\(?:times|cdot)/g, " × ")
    .replace(/\\pm/g, "±")
    .replace(/\\(?:bigl|bigr|Bigl|Bigr|left|right)/g, "")
    .replace(/\\mathbf\{([^}]*)\}/g, "$1")
    .replace(/[{}]/g, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/\*([^*\n]+)\*/g, "$1");
  const blocks = cleanText.split(/\n{2,}/);
  return (
    <div className="space-y-3 text-sm leading-6">
      {blocks.map((block, index) => {
        const lines = block.split("\n");
        const tableLines = lines.filter((line) => line.trim().startsWith("|") && line.trim().endsWith("|"));
        const isTable = tableLines.length >= 2 && /^\s*\|?\s*:?-{2,}/.test(tableLines[1].replace(/\|/g, "").trim());
        if (isTable) {
          const cells = (line) => line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((cell) => cell.trim());
          const headers = cells(tableLines[0]);
          const rows = tableLines.slice(2).map(cells);
          return (
            <div key={index} className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="min-w-full border-collapse text-left text-xs">
                <thead className="bg-slate-50 text-slate-700"><tr>{headers.map((cell, cellIndex) => <th key={cellIndex} className="border-b border-slate-200 px-3 py-2 font-bold">{cell}</th>)}</tr></thead>
                <tbody>{rows.map((row, rowIndex) => <tr key={rowIndex} className="border-b border-slate-100 last:border-0">{headers.map((_, cellIndex) => <td key={cellIndex} className="px-3 py-2 text-slate-600">{row[cellIndex] || "—"}</td>)}</tr>)}</tbody>
              </table>
            </div>
          );
        }
        const heading = block.match(/^#{1,3}\s+(.+)$/);
        if (heading) return <h3 key={index} className="m-0 text-sm font-bold text-slate-900">{heading[1]}</h3>;
        const isList = lines.every((line) =>
          /^\s*(?:[-*•]|\d+[.)])\s+/.test(line),
        );
        if (isList)
          return (
            <ul key={index} className="list-disc space-y-1 pl-5">
              {lines.map((line, lineIndex) => (
                <li key={lineIndex}>
                  {line.replace(/^\s*(?:[-*•]|\d+[.)])\s+/, "")}
                </li>
              ))}
            </ul>
          );
        return <p key={index} className="m-0 whitespace-pre-wrap">{block}</p>;
      })}
    </div>
  );
}

export const AssistantPage = () => {
  const { setHeaderContent } = useOutletContext();
  const [messages, setMessages] = useState([welcomeMessage]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [showMoreQuestions, setShowMoreQuestions] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const scrollAreaRef = useRef(null);
  const inputRef = useRef(null);
  const isWelcome = messages.length === 1;

  useEffect(() => {
    setHeaderContent({
      title: "NAWI Assistant ✨",
      subtitle: "Your AI expert for OIML R 76 and NAWI Pro workflows.",
    });
  }, [setHeaderContent]);

  useEffect(() => {
    const area = scrollAreaRef.current;
    if (!area) return;
    const distanceToBottom =
      area.scrollHeight - area.scrollTop - area.clientHeight;
    if (distanceToBottom < 180 || sending)
      area.scrollTo({ top: area.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  const startNewChat = () => {
    setMessages([welcomeMessage]);
    setDraft("");
    setError("");
    inputRef.current?.focus();
  };

  const sendMessage = async (value = draft) => {
    const content = value.trim();
    if (!content || sending) return;
    const nextMessages = [...messages, { role: "user", content }];
    setMessages(nextMessages);
    setDraft("");
    setSending(true);
    setError("");
    try {
      const response = await sendAssistantMessageApi(nextMessages.slice(1));
      setMessages((current) => [
        ...current,
        { role: "assistant", content: response.message },
      ]);
    } catch (sendError) {
      setError(
        sendError.message ||
          "Could not reach NAWI Assistant. Check your connection and try again.",
      );
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const retryLastMessage = () => {
    const previousUserMessage = [...messages]
      .reverse()
      .find((message) => message.role === "user");
    if (previousUserMessage) sendMessage(previousUserMessage.content);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    sendMessage();
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  const handleScroll = () => {
    const area = scrollAreaRef.current;
    setShowScrollButton(
      Boolean(
        area && area.scrollHeight - area.scrollTop - area.clientHeight > 240,
      ),
    );
  };

  return (
    <section className="mx-8     flex h-[calc(100dvh-125px)] min-h-[520px] max-w-[1000px] flex-col overflow-hidden rounded-[0.5rem] border border-slate-200 bg-white shadow-sm lg:h-[calc(100dvh-125px)]">
      {/*  */}

      <div
        ref={scrollAreaRef}
        onScroll={handleScroll}
        className={`relative flex-1 overflow-y-auto ${isWelcome ? "bg-[radial-gradient(ellipse_at_center,_#f7fbff_0%,_#fff_72%)]" : "space-y-5 bg-slate-50/70 px-3 py-5 sm:px-6 sm:py-7"}`}
      >
        {isWelcome ? (
          <div className="mx-auto flex min-h-full w-full max-w-[650px] flex-col items-center px-6 pb-0 pt-0 text-center sm:px-10 sm:pt-0">
            <img
              src={chatbotImage}
              alt="Friendly NAWI Assistant robot"
              className="nawi-reading-robot -mt-2 h-[80px] w-[100px] object-contain sm:h-[120px] sm:w-[140px]"
            />
            <h2 className="-mt-1.5 text-[14px] font-bold leading-tight tracking-tight text-slate-900 sm:text-[1.7rem]">
              Hi, I’m <span className="text-[#17345A]">NAWI Assistant</span>
            </h2>
            <p className="mt-0.5 max-w-[520px] text-xs leading-5 text-slate-500 sm:text-[12px] ">
              I can help you with OIML R 76 requirements, testing procedures,
              <br className="hidden sm:block" /> MPE calculations, and the NAWI
              Pro workflow.
            </p>
            <div className="mt-1 w-full space-y-1 text-left">
              {[...suggestedQuestions.slice(0, 4), ...(showMoreQuestions ? [...suggestedQuestions.slice(4), ...moreQuestions] : [])].map(({ icon: Icon, tone, text }) => (
                <button key={text} type="button" onClick={() => sendMessage(text)} className="group flex min-h-[32px] w-full items-center gap-2 rounded-lg border border-slate-200/90 bg-white/90 px-1.5 py-1 text-left shadow-[0_2px_8px_rgba(15,23,42,0.025)] transition hover:border-blue-300 hover:bg-blue-50/50">
                  <span className={`grid h-6 w-7 shrink-0 place-items-center rounded-lg ${questionTone[tone]}`}><Icon size={14} /></span>
                  <span className="flex-1 text-[10px] font-medium text-slate-800 sm:text-[11px]">{text}</span>
                  <ChevronRight size={14} className="shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-blue-600" />
                </button>
              ))}
              <div className="pt-0.5 text-center"><button type="button" onClick={() => setShowMoreQuestions((value) => !value)} className="inline-flex h-7 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 text-[9px] font-medium text-slate-600 shadow-sm transition hover:border-blue-200 hover:text-blue-700">{showMoreQuestions ? "Show fewer questions" : "View more questions"}<ChevronDown size={12} className={`transition-transform ${showMoreQuestions ? "rotate-180" : ""}`} /></button></div>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message, index) => (
              <article
                key={`${index}-${message.role}`}
                className={`flex gap-2.5 sm:gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}
              >
                <div
                  className={`grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full ${message.role === "assistant" ? "bg-blue-100 text-blue-700" : "bg-slate-200 text-slate-600"}`}
                >
                  {message.role === "assistant" ? (
                    <img src={chatbotImage} alt="NAWI Assistant" className="h-10 w-10 object-cover" />
                  ) : (
                    <span className="text-[11px] font-bold">ME</span>
                  )}
                </div>
                <div
                  className={`max-w-[92%] rounded-2xl px-3.5 py-3 sm:max-w-[82%] sm:px-4 ${message.role === "assistant" ? "rounded-tl-md border border-slate-200 bg-white text-slate-700 shadow-sm" : "rounded-tr-md bg-blue-700 text-white"}`}
                >
                  {message.role === "assistant" && (
                    <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-blue-700">
                      <Sparkles size={12} /> NAWI Assistant
                    </div>
                  )}
                  <MessageText text={message.content} />
                </div>
              </article>
            ))}
            {sending && (
              <div className="flex gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-blue-100 text-blue-700">
                  <img src={chatbotImage} alt="NAWI Assistant" className="h-10 w-10 object-cover" />
                </div>
                <div className="flex items-center gap-2 rounded-2xl rounded-tl-md border border-slate-200 bg-white px-4 py-3 text-xs text-slate-500 shadow-sm">
                  <LoaderCircle
                    size={14}
                    className="animate-spin text-blue-600"
                  />{" "}
                  Thinking through your question…
                </div>
              </div>
            )}
            {error && (
              <div
                role="alert"
                className="ml-10 flex max-w-2xl items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs text-rose-800"
              >
                <AlertCircle size={15} className="mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="m-0">{error}</p>
                  <button
                    type="button"
                    onClick={retryLastMessage}
                    className="mt-1.5 font-bold underline underline-offset-2"
                  >
                    Try again
                  </button>
                </div>
              </div>
            )}
          </>
        )}
        {showScrollButton && !isWelcome && (
          <button
            type="button"
            onClick={() =>
              scrollAreaRef.current?.scrollTo({
                top: scrollAreaRef.current.scrollHeight,
                behavior: "smooth",
              })
            }
            className="sticky bottom-3 left-1/2 ml-[calc(50%-18px)] grid h-9 w-9 place-items-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-md hover:text-blue-700"
            aria-label="Scroll to latest message"
          >
            <ArrowDown size={17} />
          </button>
        )}
      </div>

      <div className="border-t border-slate-200 bg-white px-2 pb-2 pt-1.5 sm:px-4 sm:pb-2.5">
        <form
          onSubmit={handleSubmit}
          className="flex items-end gap-1.5 rounded-xl border border-slate-200 bg-white p-1 shadow-[0_3px_12px_rgba(37,99,235,0.07)] transition focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-100"
        >
          <button
            type="button"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-slate-50 text-slate-500"
            aria-label="Attachments are not available"
          >
            <span className="text-lg">⌁</span>
          </button>
          <label className="sr-only" htmlFor="nawi-assistant-message">
            Ask NAWI Assistant
          </label>
          <textarea
            id="nawi-assistant-message"
            ref={inputRef}
            rows={1}
            maxLength={4000}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about OIML R 76, testing procedures, MPE, or NAWI Pro…"
            className="max-h-32 min-h-8 flex-1 resize-y border-0 bg-transparent px-0.5 py-1.5 text-xs text-slate-800 outline-none placeholder:text-slate-400 focus:ring-0 sm:text-sm"
          />
          <button
            type="submit"
            disabled={!draft.trim() || sending}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-blue-600 text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            aria-label="Send message"
          >
            <ArrowUp size={19} />
          </button>
        </form>
      </div>
    </section>
  );
};
