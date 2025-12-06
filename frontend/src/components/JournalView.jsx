import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Save, Smile, Meh, Frown, Trash2 } from 'lucide-react';
import axios from 'axios';

const JournalView = () => {
  const [entries, setEntries] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState('neutral');

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    try {
      const res = await axios.get('/api/journal');
      setEntries(res.data);
    } catch (error) {
      console.error('Error fetching journal:', error);
    }
  };

  const handleSave = async () => {
    try {
      await axios.post('/api/journal', { title, content, mood });
      fetchEntries();
      setTitle('');
      setContent('');
      setMood('neutral');
      setIsCreating(false);
    } catch (error) {
      console.error('Error saving entry:', error);
    }
  };

  const handleDelete = async (id) => {
    if(confirm('Delete this entry?')) {
        try {
            await axios.delete(`/api/journal/${id}`);
            fetchEntries();
        } catch (error) {
            console.error(error);
        }
    }
  }

  const MoodIcon = ({ mood, size = 18, className = "" }) => {
    if (mood === 'happy') return <Smile size={size} className={`text-green-400 ${className}`} />;
    if (mood === 'sad') return <Frown size={size} className={`text-red-400 ${className}`} />;
    return <Meh size={size} className={`text-yellow-400 ${className}`} />;
  };

  return (
    <div className="h-full flex flex-col bg-slate-950 p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Journal</h2>
          <p className="text-slate-400 text-sm">Reflect on your journey</p>
        </div>
        {!isCreating && (
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors"
          >
            <Plus size={18} />
            <span>New Entry</span>
          </button>
        )}
      </div>

      <div className="flex gap-6 h-full overflow-hidden">
        {/* Creation Panel */}
        {isCreating && (
          <div className="w-1/2 flex flex-col bg-slate-900 rounded-xl border border-slate-800 p-6 animate-in slide-in-from-left-4">
            <h3 className="text-lg font-semibold text-purple-400 mb-4">New Entry</h3>
            
            <input
              type="text"
              placeholder="Entry Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white mb-4 focus:outline-none focus:border-purple-500"
            />
            
            <div className="flex gap-4 mb-4">
              {['happy', 'neutral', 'sad'].map((m) => (
                <button
                  key={m}
                  onClick={() => setMood(m)}
                  className={`flex-1 py-2 rounded-lg border flex justify-center items-center gap-2 transition-all ${
                    mood === m 
                      ? 'bg-slate-800 border-purple-500 text-white' 
                      : 'border-slate-800 text-slate-500 hover:bg-slate-800'
                  }`}
                >
                  <MoodIcon mood={m} />
                  <span className="capitalize text-sm">{m}</span>
                </button>
              ))}
            </div>

            <textarea
              placeholder="What's on your mind?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 resize-none mb-4"
            />

            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!title || !content}
                className="flex items-center gap-2 px-6 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-lg"
              >
                <Save size={18} />
                <span>Save Entry</span>
              </button>
            </div>
          </div>
        )}

        {/* Timeline View */}
        <div className={`flex-1 overflow-y-auto space-y-8 pr-4 ${isCreating ? 'w-1/2' : 'w-full'}`}>
          {entries.length === 0 ? (
             <div className="h-full flex flex-col items-center justify-center text-slate-500">
                <BookOpen size={48} className="mb-4 opacity-20" />
                <p>Your journal is empty.</p>
             </div>
          ) : (
             entries.map((entry, idx) => (
                <div key={entry.id} className="relative pl-8 border-l border-slate-800 last:border-0">
                  <div className="absolute -left-3 top-0 w-6 h-6 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-purple-500" />
                  </div>
                  
                  <div className="mb-1 flex items-center gap-4">
                    <span className="text-sm font-medium text-slate-500">
                      {new Date(entry.created_at).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                    <MoodIcon mood={entry.mood} size={16} />
                     <button 
                        onClick={() => handleDelete(entry.id)}
                        className="opacity-0 hover:opacity-100 p-1 text-red-500 transition-opacity"
                     >
                       <Trash2 size={14} />
                     </button>
                  </div>
                  
                  <div className="bg-slate-900/50 rounded-xl p-5 border border-slate-800/50 hover:border-slate-700 transition-colors">
                    <h3 className="text-lg font-semibold text-slate-200 mb-2">{entry.title}</h3>
                    <p className="text-slate-400 whitespace-pre-wrap leading-relaxed">
                      {entry.content}
                    </p>
                  </div>
                </div>
             ))
          )}
        </div>
      </div>
    </div>
  );
};

export default JournalView;
