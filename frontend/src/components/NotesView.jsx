import React, { useState, useEffect } from 'react';
import { Plus, X, Save, Edit2, Trash2 } from 'lucide-react';
import axios from 'axios';

const NotesView = () => {
  const [notes, setNotes] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const res = await axios.get('/api/notes');
      setNotes(res.data);
    } catch (error) {
      console.error('Error fetching notes:', error);
    }
  };

  const resetForm = () => {
    setTitle('');
    setContent('');
    setTags('');
    setIsCreating(false);
    setEditingId(null);
  };

  const handleSave = async () => {
    try {
      const payload = { title, content, tags };
      if (editingId) {
        await axios.patch(`/api/notes/${editingId}`, payload);
      } else {
        await axios.post('/api/notes', payload);
      }
      fetchNotes();
      resetForm();
    } catch (error) {
      console.error('Error saving note:', error);
    }
  };

  const handleEdit = (note) => {
    setTitle(note.title);
    setContent(note.content);
    setTags(note.tags || '');
    setEditingId(note.id);
    setIsCreating(true);
  };

  const handleDelete = async (id) => {
    if (confirm('Delete this note?')) {
      try {
        await axios.delete(`/api/notes/${id}`);
        fetchNotes();
      } catch (error) {
        console.error('Error deleting note:', error);
      }
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-950 p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Notes</h2>
          <p className="text-slate-400 text-sm">Capture your thoughts and ideas</p>
        </div>
        {!isCreating && (
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-lg transition-all shadow-lg shadow-amber-900/20"
          >
            <Plus size={18} />
            <span>New Note</span>
          </button>
        )}
      </div>

      {isCreating && (
        <div className="mb-8 p-6 bg-slate-900 rounded-xl border border-slate-800 animate-in fade-in slide-in-from-top-4 shadow-2xl shadow-amber-900/10">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-semibold text-amber-500">
              {editingId ? 'Edit Note' : 'Create Note'}
            </h3>
            <button onClick={resetForm} className="text-slate-500 hover:text-white">
              <X size={20} />
            </button>
          </div>
          
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Note Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50"
            />
            <textarea
              placeholder="Write your note here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full h-48 bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 resize-none"
            />
            <input
              type="text"
              placeholder="Tags (comma separated)"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm text-slate-300 focus:outline-none focus:border-amber-500/50"
            />
            <div className="flex justify-end gap-3">
              <button 
                onClick={resetForm}
                className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!title || !content}
                className="flex items-center gap-2 px-6 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors shadow-lg shadow-amber-900/20"
              >
                <Save size={18} />
                <span>Save Note</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto pb-6">
        {notes.length === 0 && !isCreating ? (
          <div className="col-span-full flex flex-col items-center justify-center text-slate-500 mt-20">
            <Edit2 size={48} className="mb-4 opacity-20" />
            <p>No notes yet. Create one to get started.</p>
          </div>
        ) : (
          notes.map((note) => (
            <div key={note.id} className="group bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-amber-500/30 transition-all hover:shadow-lg hover:shadow-amber-900/10">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-semibold text-lg text-slate-100 line-clamp-1 group-hover:text-amber-400 transition-colors">{note.title}</h3>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleEdit(note)}
                    className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-amber-400"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => handleDelete(note.id)}
                    className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-red-400"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <p className="text-slate-400 text-sm line-clamp-5 mb-4 whitespace-pre-wrap">{note.content}</p>
              
              <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-800/50">
                <span className="text-xs text-slate-600">
                  {new Date(note.updated_at).toLocaleDateString()}
                </span>
                {note.tags && (
                  <div className="flex gap-1">
                    {note.tags.split(',').slice(0, 2).map((tag, i) => (
                      <span key={i} className="text-xs px-2 py-0.5 bg-amber-500/10 rounded-full text-amber-500 border border-amber-500/20">
                        {tag.trim()}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotesView;
