import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, CheckCircle, Circle, Calendar, User, Flag, Clock, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../utils/api';

const Tasks = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, inProgress: 0, completed: 0 });
  const [loading, setLoading] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium',
    due_date: '',
    assigned_lawyer: '',
    case_secure_id: ''
  });

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await api.get('/user/tasks', {
        params: { 
          status: statusFilter !== 'all' ? statusFilter : undefined, 
          priority: priorityFilter !== 'all' ? priorityFilter : undefined,
          search: searchTerm 
        }
      });
      if (response.data.success) {
        setTasks(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/user/tasks/stats');
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    fetchStats();
    const timeoutId = setTimeout(() => {
      fetchTasks();
    }, searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' ? 300 : 0);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, statusFilter, priorityFilter]);

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });



  const handleAddTask = async () => {
    if (!newTask.title || !newTask.due_date) {
      toast.error('Please fill in title and due date');
      return;
    }
    
    try {
      setLoading(true);
      const response = await api.post('/user/tasks', newTask);
      if (response.data.success) {
        toast.success('Task created successfully');
        fetchTasks();
        fetchStats();
        setNewTask({ title: '', description: '', priority: 'medium', due_date: '', assigned_lawyer: '', case_secure_id: '' });
        setShowModal(false);
      }
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error('Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  const handleEditTask = async () => {
    if (!editingTask.title || !editingTask.due_date) {
      toast.error('Please fill in title and due date');
      return;
    }
    
    try {
      setLoading(true);
      const response = await api.put(`/user/tasks/${editingTask.id}`, {
        title: editingTask.title,
        description: editingTask.description,
        priority: editingTask.priority,
        due_date: editingTask.due_date,
        assigned_lawyer: editingTask.assigned_lawyer
      });
      if (response.data.success) {
        toast.success('Task updated successfully');
        fetchTasks();
        fetchStats();
        setEditingTask(null);
      }
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTask = async (taskId) => {
    toast(
      <div className="flex flex-col gap-3">
        <p className="font-medium text-gray-900">Delete Task</p>
        <p className="text-sm text-gray-600">Are you sure you want to delete this task? This action cannot be undone.</p>
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => toast.dismiss()}
            className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={async () => {
              toast.dismiss();
              try {
                setLoading(true);
                const response = await api.delete(`/user/tasks/${taskId}`);
                if (response.data.success) {
                  toast.success('Task deleted successfully');
                  fetchTasks();
                  fetchStats();
                }
              } catch (error) {
                console.error('Error deleting task:', error);
                toast.error('Failed to delete task');
              } finally {
                setLoading(false);
              }
            }}
            className="px-3 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>,
      {
        duration: 10000,
        position: 'top-center'
      }
    );
  };

  const toggleTaskComplete = async (taskId, currentStatus) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    try {
      const response = await api.put(`/user/tasks/${taskId}`, { status: newStatus });
      if (response.data.success) {
        fetchTasks();
        fetchStats();
      }
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task');
    }
  };

  const isOverdue = (dueDate) => {
    return new Date(dueDate) < new Date() && !tasks.find(t => t.dueDate === dueDate)?.completed;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-gray-50/30 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Tasks</h1>
            <p className="text-gray-600 mt-1">Manage your legal tasks and track progress</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <Plus className="w-5 h-5" />
            New Task
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Tasks', value: stats.total, color: 'from-blue-500 to-blue-600', icon: CheckCircle },
            { label: 'Pending', value: stats.pending, color: 'from-gray-500 to-gray-600', icon: Circle },
            { label: 'In Progress', value: stats.inProgress, color: 'from-yellow-500 to-yellow-600', icon: Clock },
            { label: 'Completed', value: stats.completed, color: 'from-green-500 to-green-600', icon: CheckCircle }
          ].map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <div key={`stat-${index}`} className="bg-white/70 backdrop-blur-md rounded-2xl border border-white/20 p-6 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">{stat.label}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 bg-gradient-to-r ${stat.color} rounded-xl flex items-center justify-center shadow-lg`}>
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Filters */}
        <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-white/20 p-6 shadow-lg">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/50 border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all duration-300 backdrop-blur-sm"
              />
            </div>
            <div className="flex items-center gap-3">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-3 bg-white/50 border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all duration-300 backdrop-blur-sm"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-4 py-3 bg-white/50 border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all duration-300 backdrop-blur-sm"
              >
                <option value="all">All Priority</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tasks List */}
        <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-white/20 shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200/50">
            <h2 className="text-xl font-semibold text-gray-900">Your Tasks ({tasks.length})</h2>
          </div>
          <div className="divide-y divide-gray-200/50">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
              <p className="text-gray-600">Create your first task to get started</p>
            </div>
          ) : (
            tasks.map(task => (
              <div key={task.id} className={`p-3 lg:p-4 hover:bg-gray-50 transition-colors ${task.status === 'completed' ? 'opacity-75' : ''}`}>
                <div className="flex items-start gap-2 lg:gap-4">
                  <button
                    onClick={() => toggleTaskComplete(task.id, task.status)}
                    className="mt-1 text-gray-400 hover:text-blue-600 transition-colors flex-shrink-0"
                  >
                    {task.status === 'completed' ? (
                      <CheckCircle className="w-4 h-4 lg:w-5 lg:h-5 text-green-600" />
                    ) : (
                      <Circle className="w-4 h-4 lg:w-5 lg:h-5" />
                    )}
                  </button>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className={`font-semibold text-sm lg:text-base ${task.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                          {task.title}
                        </h3>
                        <p className="text-xs lg:text-sm text-gray-600 mt-1 line-clamp-2">{task.description}</p>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <span className={`px-2 py-1 text-xs rounded-full whitespace-nowrap ${getStatusColor(task.status)}`}>
                          {task.status}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full whitespace-nowrap ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 lg:gap-4 text-xs lg:text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 lg:w-4 lg:h-4" />
                        <span className={isOverdue(task.due_date) ? 'text-red-600 font-medium' : ''}>
                          <span className="hidden sm:inline">Due: </span>{new Date(task.due_date).toLocaleDateString()}
                        </span>
                      </div>
                      {task.assigned_lawyer && (
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3 lg:w-4 lg:h-4" />
                          <span className="truncate">{task.assigned_lawyer}</span>
                        </div>
                      )}
                      {task.case_number && (
                        <div className="flex items-center gap-1">
                          <Flag className="w-3 h-3 lg:w-4 lg:h-4" />
                          <span className="truncate"><span className="hidden sm:inline">Case: </span>{task.case_number}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 lg:w-4 lg:h-4" />
                        <span className="hidden sm:inline">Created: {new Date(task.created_at).toLocaleDateString()}</span>
                        <span className="sm:hidden">{new Date(task.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 mt-3">
                      <button 
                        onClick={() => handleDeleteTask(task.id)}
                        className="flex items-center gap-1 px-3 py-1 text-xs text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-200"
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add/Edit Task Modal */}
      {(showModal || editingTask) && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-white/20">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingTask ? 'Edit Task' : 'Create New Task'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Task Title</label>
                <input
                  type="text"
                  value={editingTask ? editingTask.title : newTask.title}
                  onChange={(e) => editingTask 
                    ? setEditingTask({...editingTask, title: e.target.value})
                    : setNewTask({...newTask, title: e.target.value})
                  }
                  className="w-full px-3 py-2 bg-white/50 border border-gray-200/50 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all duration-300"
                  placeholder="Enter task title"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={editingTask ? editingTask.description : newTask.description}
                  onChange={(e) => editingTask 
                    ? setEditingTask({...editingTask, description: e.target.value})
                    : setNewTask({...newTask, description: e.target.value})
                  }
                  rows={3}
                  className="w-full px-3 py-2 bg-white/50 border border-gray-200/50 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all duration-300 resize-none"
                  placeholder="Task description"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={editingTask ? editingTask.priority : newTask.priority}
                    onChange={(e) => editingTask 
                      ? setEditingTask({...editingTask, priority: e.target.value})
                      : setNewTask({...newTask, priority: e.target.value})
                    }
                    className="w-full px-3 py-2 bg-white/50 border border-gray-200/50 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all duration-300"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={editingTask ? editingTask.due_date : newTask.due_date}
                    onChange={(e) => editingTask 
                      ? setEditingTask({...editingTask, due_date: e.target.value})
                      : setNewTask({...newTask, due_date: e.target.value})
                    }
                    className="w-full px-3 py-2 bg-white/50 border border-gray-200/50 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all duration-300"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assigned To</label>
                <input
                  type="text"
                  value={editingTask ? editingTask.assigned_lawyer : newTask.assigned_lawyer}
                  onChange={(e) => editingTask 
                    ? setEditingTask({...editingTask, assigned_lawyer: e.target.value})
                    : setNewTask({...newTask, assigned_lawyer: e.target.value})
                  }
                  className="w-full px-3 py-2 bg-white/50 border border-gray-200/50 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all duration-300"
                  placeholder="Lawyer or team member"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingTask(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300/50 text-gray-700 rounded-lg hover:bg-gray-50/50 transition-all duration-300"
              >
                Cancel
              </button>
              <button
                onClick={editingTask ? handleEditTask : handleAddTask}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg"
              >
                {editingTask ? 'Update Task' : 'Create Task'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
  );
};

export default Tasks;