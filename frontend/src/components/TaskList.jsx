import React, { useState, useEffect } from 'react';
import { CheckCircle2, Circle, Clock, AlertCircle, RefreshCw, Plus, Trash2 } from 'lucide-react';
import axios from 'axios';

const TaskList = () => {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, todo, in_progress, done

  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get('/api/tasks');
      setTasks(response.data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleStatusUpdate = async (taskId, newStatus) => {
    // Optimistic update
    setTasks(prev => prev.map(t => 
      t.id === taskId ? { ...t, status: newStatus } : t
    ));

    try {
      await axios.patch(`/api/tasks/${taskId}/status`, { status: newStatus });
    } catch (error) {
      console.error('Error updating task:', error);
      fetchTasks(); // Revert on error
    }
  };

  const getPriorityColor = (priority) => {
    if (priority >= 4) return 'text-orange-500 bg-orange-500/10 border-orange-500/20'; // High - Orange
    if (priority >= 3) return 'text-amber-500 bg-amber-500/10 border-amber-500/20'; // Med - Amber
    return 'text-slate-400 bg-slate-400/10 border-slate-400/20'; // Low - Slate
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === 'all') return true;
    return task.status === filter;
  });

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', priority: 1, description: '' });

// ... (methods kept same)

  return (
    <div className="h-full flex flex-col bg-slate-950 p-6 relative">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white">Tasks</h2>
          <p className="text-slate-400 text-sm mt-1">Manage your AI-generated tasks</p>
        </div>
        <div className="flex gap-2">
            <button 
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white rounded-lg transition-all shadow-lg shadow-orange-600/20 font-medium"
            >
            <Plus size={20} />
            <span>New Task</span>
            </button>
            <button 
            onClick={fetchTasks}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            >
            <RefreshCw size={20} />
            </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {['all', 'todo', 'in_progress', 'done'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
              filter === f
                ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20'
                : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800'
            }`}
          >
            {f.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <RefreshCw className="animate-spin text-orange-500" size={24} />
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <p>No tasks found</p>
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div
              key={task.id}
              className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 hover:border-orange-500/30 transition-colors group relative"
            >
              <div className="flex items-start gap-4">
                <button
                  onClick={() => handleStatusUpdate(task.id, task.status === 'done' ? 'todo' : 'done')}
                  className={`mt-1 flex-shrink-0 transition-colors ${
                    task.status === 'done' ? 'text-green-500' : 'text-slate-500 group-hover:text-orange-500'
                  }`}
                >
                  {task.status === 'done' ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                </button>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className={`font-medium truncate ${
                      task.status === 'done' ? 'text-slate-500 line-through' : 'text-slate-200'
                    }`}>
                      {task.title}
                    </h3>
                    <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded border ${getPriorityColor(task.priority)}`}>
                        P{task.priority || 1}
                        </span>
                        <button 
                            onClick={() => handleDeleteTask(task.id)}
                            className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                  </div>
                  
                  {task.description && (
                    <p className="text-sm text-slate-400 mt-1 line-clamp-2">{task.description}</p>
                  )}
                  
                  <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                    {task.due_date && (
                      <div className="flex items-center gap-1">
                        <Clock size={12} />
                        <span>{new Date(task.due_date).toLocaleDateString()}</span>
                      </div>
                    )}
                    {task.subtasks && task.subtasks.length > 0 && (
                      <div className="flex items-center gap-1">
                        <AlertCircle size={12} />
                        <span>{task.subtasks.length} subtasks</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

       {/* Create Modal */}
       {showCreateModal && (
        <div className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl shadow-orange-900/20">
            <h3 className="text-xl font-bold text-white mb-4">New Task</h3>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Title</label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={e => setNewTask({...newTask, title: e.target.value})}
                  className="w-full bg-slate-800 border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                  placeholder="What needs to be done?"
                  autoFocus
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Priority (1-5)</label>
                 <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map(p => (
                        <button
                            key={p}
                            type="button"
                            onClick={() => setNewTask({...newTask, priority: p})}
                            className={`w-10 h-10 rounded-lg font-bold transition-all ${
                                newTask.priority === p 
                                ? 'bg-orange-600 text-white shadow-lg scale-105' 
                                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                            }`}
                        >
                            {p}
                        </button>
                    ))}
                 </div>
              </div>

               <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Description</label>
                <textarea
                  value={newTask.description}
                  onChange={e => setNewTask({...newTask, description: e.target.value})}
                  className="w-full bg-slate-800 border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                  placeholder="Add details..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white rounded-lg font-medium transition-all shadow-lg shadow-orange-600/20"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskList;
