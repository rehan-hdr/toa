import React, { useState, useEffect } from 'react';
import { MessageSquare, CheckSquare, Plus, MessageCircle, BookOpen, StickyNote } from 'lucide-react';
import axios from 'axios';

const Layout = ({ children, activeTab, setActiveTab, conversationId, setConversationId }) => {
  const [conversations, setConversations] = useState([]);

  const fetchConversations = async () => {
    try {
      const response = await axios.get('/api/conversations');
      setConversations(response.data);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  useEffect(() => {
    fetchConversations();
    // Refresh list every 5s or add proper state management (simplified for now)
    const interval = setInterval(fetchConversations, 5000);
    return () => clearInterval(interval);
  }, [conversationId]); // Refresh when conversation changes (e.g. new title)

  const handleNewChat = () => {
    setConversationId(null);
    setActiveTab('chat');
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Nexus
          </h1>
          <p className="text-xs text-slate-400 mt-1">Local AI Assistant</p>
        </div>

        <div className="p-4">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors"
          >
            <Plus size={18} />
            <span className="font-medium">New Chat</span>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 space-y-6">
          {/* Main Nav */}
          <div className="space-y-2">
             <button
              onClick={() => setActiveTab('tasks')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                activeTab === 'tasks'
                  ? 'bg-purple-600/10 text-purple-400 border border-purple-600/20'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <CheckSquare size={20} />
              <span className="font-medium">Tasks</span>
            </button>

            <button
              onClick={() => setActiveTab('notes')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                activeTab === 'notes'
                  ? 'bg-yellow-600/10 text-yellow-400 border border-yellow-600/20'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <MessageSquare size={20} />
              <span className="font-medium">Notes</span>
            </button>
            
             <button
              onClick={() => setActiveTab('journal')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                activeTab === 'journal'
                  ? 'bg-pink-600/10 text-pink-400 border border-pink-600/20'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <MessageSquare size={20} />
              <span className="font-medium">Journal</span>
            </button>
          </div>

          {/* History */}
          <div>
            <h3 className="text-xs font-semibold text-slate-500 mb-3 px-2 uppercase tracking-wider">
              History
            </h3>
            <div className="space-y-1">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => {
                    setConversationId(conv.id);
                    setActiveTab('chat');
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-left transition-all duration-200 ${
                    conversationId === conv.id
                      ? 'bg-slate-800 text-blue-400'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-300'
                  }`}
                >
                  <MessageCircle size={16} className="flex-shrink-0" />
                  <span className="truncate">{conv.title}</span>
                </button>
              ))}
            </div>
          </div>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-slate-900/50 border border-slate-800">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-slate-400">System Online</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {children}
      </main>
    </div>
  );
};

export default Layout;
