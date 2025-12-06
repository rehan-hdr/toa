import React, { useState, useEffect } from 'react';
import { MessageSquare, CheckSquare, Plus, MessageCircle, BookOpen, StickyNote, Share2 } from 'lucide-react';
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
    const interval = setInterval(fetchConversations, 5000);
    return () => clearInterval(interval);
  }, [conversationId]);

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 font-sans selection:bg-orange-500/30">
      {/* Sidebar */}
      <div className="w-64 flex flex-col border-r border-slate-800 bg-slate-950">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <span className="font-bold text-white text-lg">N</span>
            </div>
            <h1 className="font-bold text-xl tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-500">
              NEXUS
            </h1>
          </div>

          <button 
             onClick={() => {
                setActiveTab('chat');
                setConversationId(null);
             }}
             className="w-full flex items-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 text-white font-medium shadow-lg shadow-orange-600/20 hover:from-orange-500 hover:to-amber-500 transition-all duration-200 group"
          >
            <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
            <span>New Chat</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 space-y-2">
          <div className="mb-6 space-y-1">
            <h3 className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Workspace
            </h3>
            
            <button
              onClick={() => setActiveTab('chat')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                activeTab === 'chat'
                  ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <MessageSquare size={20} />
              <span className="font-medium">Chat</span>
            </button>

            <button
              onClick={() => setActiveTab('tasks')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                activeTab === 'tasks'
                  ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20'
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
                  ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <StickyNote size={20} />
              <span className="font-medium">Notes</span>
            </button>

            <button
              onClick={() => setActiveTab('journal')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                activeTab === 'journal'
                  ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <BookOpen size={20} />
              <span className="font-medium">Journal</span>
            </button>
            
             <button
              onClick={() => setActiveTab('graph')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                activeTab === 'graph'
                  ? 'bg-cyan-600/10 text-cyan-400 border border-cyan-600/20'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <Share2 size={20} />
              <span className="font-medium">Mind Map</span>
            </button>
          </div>

          {/* History */}
          <div>
            <h3 className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
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
                      ? 'bg-slate-800 text-orange-400 border border-slate-700'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-300'
                  }`}
                >
                  <MessageCircle size={16} className="flex-shrink-0" />
                  <span className="truncate">{conv.title}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

         <div className="p-4 border-t border-slate-800 bg-slate-950">
          <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-slate-900/50 border border-slate-800">
            <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
            <span className="text-xs text-slate-400 font-medium">System Online</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden bg-slate-950">
        {children}
      </main>
    </div>
  );
};

export default Layout;
