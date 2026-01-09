import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, User, Bot, ChevronDown, Minus } from 'lucide-react';

interface ChatMessage {
    role: 'user' | 'model';
    parts: string[];
}

const AIChatBot: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            role: 'model',
            parts: ["Hello! I'm your Urban Sims Expert Guide. How can I help you with your microgreens today?"]
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
            // Puter.js AI integration
            // @ts-ignore
            const response = await puter.ai.chat(
                `You are the 'Urban Sims Expert Guide', a helpful AI assistant integrated into a Microgreens Tracking application.
                Your goal is to help users succeed in growing high-quality microgreens at home.
                
                - Be technical but accessible.
                - Knowledgeable about varieties like Amaranth, Radish, Broccoli, Pea shoots, and Sunflower.
                - Expert in: seed density, soaking times, blackout periods, watering frequency, and troubleshooting mold or yellowing.
                - Tone: Encouraging, professional, and precise.
                
                Keep history in mind: ${newMessages.map(m => `${m.role}: ${m.parts[0]}`).join('\n')}
                
                Respond to the last message: ${inputValue}`
            );

            // Puter response is usually the text itself or an object with message
            const botText = typeof response === 'string' ? response : response.message?.content || JSON.stringify(response);

            setMessages(prev => [...prev, { role: 'model', parts: [botText] }]);
        } catch (error: any) {
            console.error("Puter Chat Error:", error);
            setMessages(prev => [...prev, {
                role: 'model',
                parts: ["I'm sorry, I'm having trouble connecting to my brain via Puter. Please try again later!"]
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
                        <h4 className="font-bold text-sm">Grow Guide AI</h4>
                        <div className="flex items-center space-x-1">
                            <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                            <span className="text-[10px] text-green-50 font-medium uppercase tracking-wider">Online</span>
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
                        {messages.map((m, idx) => (
                            <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm ${m.role === 'user'
                                    ? 'bg-green-500 text-white rounded-tr-none shadow-md shadow-green-100'
                                    : 'bg-gray-100 text-gray-800 rounded-tl-none border border-gray-200'
                                    }`}>
                                    <p className="leading-relaxed">{m.parts[0]}</p>
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
                                placeholder="Ask about growth..."
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
