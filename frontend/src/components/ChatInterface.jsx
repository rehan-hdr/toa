import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import axios from 'axios';

const ChatInterface = ({ conversationId, setConversationId }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const loadConversation = async () => {
      if (conversationId) {
        setIsLoading(true);
        try {
          const res = await axios.get(`/api/conversations/${conversationId}/messages`);
          setMessages(res.data);
        } catch (err) {
          console.error(err);
        } finally {
          setIsLoading(false);
        }
      } else {
        setMessages([]);
      }
    };
    loadConversation();
  }, [conversationId]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await axios.post('/api/chat', { 
        message: userMessage.content,
        conversation_id: conversationId 
      });
      
      const aiMessage = { 
        role: 'assistant', 
        content: response.data.response,
        category: response.data.category,
        summary: response.data.summary,
        produced_task: response.data.produced_task
      };
      setMessages(prev => [...prev, aiMessage]);
      
      if (!conversationId && response.data.conversation_id) {
        setConversationId(response.data.conversation_id);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error processing your request.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-50">
            <Bot size={48} className="mb-4" />
            <p className="text-lg">Start a conversation with Nexus</p>
          </div>
        )}
        
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              msg.role === 'user' ? 'bg-blue-600' : 'bg-purple-600'
            }`}>
              {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
            </div>
            
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
              msg.role === 'user' 
                ? 'bg-blue-600/10 text-blue-100 border border-blue-600/20' 
                : 'bg-slate-900 text-slate-100 border border-slate-800'
            }`}>
              <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
              
              {/* Task Card in Chat */}
              {msg.produced_task && (
                <div className="mt-3 bg-slate-950/50 rounded-lg p-3 border border-slate-800/50">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="font-medium text-blue-400">Task Created</span>
                  </div>
                  <div className="pl-4 border-l-2 border-slate-800">
                    <p className="font-medium text-slate-200">{msg.produced_task.title}</p>
                    {msg.produced_task.due_date && (
                      <p className="text-xs text-slate-500 mt-1">Due: {new Date(msg.produced_task.due_date).toLocaleDateString()}</p>
                    )}
                  </div>
                </div>
              )}

              {msg.category && (
                <div className="mt-2 pt-2 border-t border-slate-800/50 flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                    {msg.category}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0">
              <Bot size={16} />
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 flex items-center gap-2">
              <Loader2 size={16} className="animate-spin text-purple-400" />
              <span className="text-slate-400 text-sm">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-slate-900/50 border-t border-slate-800">
        <form onSubmit={handleSend} className="max-w-4xl mx-auto relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-4 pr-12 py-3 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all text-slate-100 placeholder-slate-500"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;
