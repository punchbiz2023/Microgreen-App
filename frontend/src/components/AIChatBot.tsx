import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, ChevronDown, Minus } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useTranslation } from 'react-i18next';

interface ChatMessage {
    role: 'user' | 'model';
    parts: string[];
}

const AIChatBot: React.FC = () => {
    const { t, i18n } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            role: 'model',
            parts: [t('chat.welcome_msg')]
        }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen && !isMinimized) {
            scrollToBottom();
        }
    }, [messages, isOpen, isMinimized]);

    const handleSend = async () => {
        if (!inputValue.trim() || isLoading) return;

        const userMsg: ChatMessage = { role: 'user', parts: [inputValue] };
        const newMessages = [...messages, userMsg];
        setMessages(newMessages);
        setInputValue('');
        setIsLoading(true);

        try {
            // Reverting to Puter.js AI as requested by user
            // @ts-ignore
            const response = await puter.ai.chat(
                `${t('chat.ai_instruction')}
                
                LANGUAGE: Respond strictly in ${i18n.language === 'ta' ? 'Tamil' : 'English'}.
                
                Respond to: ${inputValue}`
            );

            const botText = typeof response === 'string' ? response : response.message?.content || JSON.stringify(response);

            setMessages((prev: ChatMessage[]) => [...prev, { role: 'model', parts: [botText] }]);
        } catch (error: any) {
            console.error("Puter Chat Error:", error);
            setMessages((prev: ChatMessage[]) => [...prev, {
                role: 'model',
                parts: [t('chat.error_msg')]
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-8 right-8 w-14 h-14 bg-green-500 text-white rounded-full flex items-center justify-center shadow-xl hover:bg-green-600 hover:scale-110 active:scale-95 transition-all duration-300 z-50"
            >
                <MessageSquare size={24} />
            </button>
        );
    }

    return (
        <div className={`fixed bottom-8 right-8 z-50 flex flex-col transition-all duration-300 ${isMinimized ? 'h-16' : 'h-[550px]'} w-[380px] max-w-[90vw] bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100`}>
            {/* Header */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-5 text-white flex items-center justify-between shrink-0 relative">
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12 blur-xl"></div>

                <div className="flex items-center space-x-3 relative z-10">
                    <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                        <Bot size={20} />
                    </div>
                    <div>
                        <h4 className="font-bold text-sm">{t('chat.title')}</h4>
                        <div className="flex items-center space-x-1">
                            <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                            <span className="text-[10px] text-green-50 font-medium uppercase tracking-wider">{t('chat.online')}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center space-x-1 relative z-10">
                    <button
                        onClick={() => setIsMinimized(!isMinimized)}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                        {isMinimized ? <ChevronDown size={16} /> : <Minus size={16} />}
                    </button>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>

            {/* Chat Area */}
            {!isMinimized && (
                <div className="flex-1 flex flex-col min-h-0">
                    <div className="flex-1 overflow-y-auto p-5 space-y-4">
                        {messages.map((m: ChatMessage, idx: number) => (
                            <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm ${m.role === 'user'
                                    ? 'bg-green-500 text-white rounded-tr-none shadow-md shadow-green-100'
                                    : 'bg-gray-100 text-gray-800 rounded-tl-none border border-gray-200'
                                    }`}>
                                    {m.role === 'user' ? (
                                        <p className="leading-relaxed">{m.parts[0]}</p>
                                    ) : (
                                        <div className="prose prose-sm max-w-none text-gray-800 leading-relaxed markdown-container">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                {m.parts[0]}
                                            </ReactMarkdown>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-tl-none border border-gray-200 flex space-x-1">
                                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-.3s]"></div>
                                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-.5s]"></div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-4 bg-gray-50 border-t border-gray-100">
                        <div className="flex items-center bg-white rounded-xl border border-gray-200 px-3 py-1 focus-within:border-green-500 focus-within:ring-4 focus-within:ring-green-50 transition-all">
                            <input
                                type="text"
                                placeholder={t('chat.placeholder')}
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                className="flex-1 py-3 bg-transparent outline-none text-gray-700 text-sm font-medium"
                            />
                            <button
                                onClick={handleSend}
                                disabled={!inputValue.trim() || isLoading}
                                className={`p-2 rounded-lg transition-all ${inputValue.trim() ? 'bg-green-500 text-white' : 'text-gray-300'}`}
                            >
                                <Send size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AIChatBot;
