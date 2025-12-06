import React, { useState, useEffect } from 'react';
import { CheckCircle2, Circle, Clock, AlertCircle, RefreshCw } from 'lucide-react';
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
    if (priority >= 8) return 'text-red-400 bg-red-400/10 border-red-400/20';
    if (priority >= 5) return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
    return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === 'all') return true;
    return task.status === filter;
  });

  return (
    <div className="h-full flex flex-col bg-slate-950 p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-100">Tasks</h2>
          <p className="text-slate-400 text-sm mt-1">Manage your AI-generated tasks</p>
        </div>
        <button 
          onClick={fetchTasks}
          className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <RefreshCw size={20} />
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {['all', 'todo', 'in_progress', 'done'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
              filter === f
                ? 'bg-blue-600 text-white'
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
            <RefreshCw className="animate-spin text-slate-500" size={24} />
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <p>No tasks found</p>
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div
              key={task.id}
              className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-colors group"
            >
              <div className="flex items-start gap-4">
                <button
                  onClick={() => handleStatusUpdate(task.id, task.status === 'done' ? 'todo' : 'done')}
                  className={`mt-1 flex-shrink-0 transition-colors ${
                    task.status === 'done' ? 'text-green-500' : 'text-slate-500 group-hover:text-slate-400'
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
                    <span className={`text-xs px-2 py-0.5 rounded border ${getPriorityColor(task.priority)}`}>
                      P{task.priority}
                    </span>
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
    </div>
  );
};

export default TaskList;
