import React, { useState, useEffect } from 'react';
import { Plus, CheckSquare, Clock, AlertCircle, Filter } from 'lucide-react';
import api from '../../utils/api';
import CreateTaskModal from '../../components/modals/CreateTaskModal';

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await api.get('/tasks');
      setTasks(response.data?.data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'bg-[#DCFCE7] text-[#1F5632]',
      medium: 'bg-[#FFF4E0] text-[#654C1F]',
      high: 'bg-[#FFE3E1] text-[#931B12]',
      urgent: 'bg-[#FEE2E2] text-[#991B1B]'
    };
    return colors[priority?.toLowerCase()] || colors.medium;
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-[#FFF4E0] text-[#654C1F]',
      in_progress: 'bg-[#DBEAFE] text-[#1E40AF]',
      completed: 'bg-[#DCFCE7] text-[#1F5632]',
      cancelled: 'bg-[#F3F4F6] text-[#6B7280]'
    };
    return colors[status?.toLowerCase()] || colors.pending;
  };

  const filteredTasks = tasks.filter(task => {
    const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;
    return matchesStatus && matchesPriority;
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#181A2A]">Tasks</h1>
          <p className="text-[#737791] mt-1">Manage your tasks and deadlines</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-[#28B779] text-white px-4 py-2 rounded-lg hover:bg-[#229966]"
        >
          <Plus className="w-4 h-4" />
          New Task
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-[#F8F9FA] shadow-md p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-[#737791]" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-[#F8F9FA] rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-4 py-2 border border-[#F8F9FA] rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Priority</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#F8F9FA] shadow-md">
        <div className="p-6 border-b border-[#F8F9FA]">
          <h2 className="text-lg font-semibold text-[#181A2A]">All Tasks ({filteredTasks.length})</h2>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0086CB] mx-auto"></div>
              <p className="text-[#737791] mt-2">Loading tasks...</p>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="text-center py-8">
              <CheckSquare className="w-12 h-12 text-[#737791] mx-auto mb-4" />
              <p className="text-[#737791]">No tasks found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTasks.map((task) => (
                <div key={task.id} className="border border-[#F8F9FA] rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-[#181A2A] mb-1">{task.title}</h3>
                      <p className="text-sm text-[#737791] mb-2">{task.description}</p>
                      <div className="flex items-center gap-4 text-sm text-[#737791]">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>Due: {formatDate(task.due_date)}</span>
                        </div>
                        {task.case_id && (
                          <span>Case: {task.case_id}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 ml-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(task.priority)}`}>
                        {task.priority?.charAt(0).toUpperCase() + task.priority?.slice(1)}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(task.status)}`}>
                        {task.status?.replace('_', ' ').charAt(0).toUpperCase() + task.status?.replace('_', ' ').slice(1)}
                      </span>
                    </div>
                  </div>
                  {new Date(task.due_date) < new Date() && task.status !== 'completed' && (
                    <div className="flex items-center gap-2 text-red-600 text-sm">
                      <AlertCircle className="w-4 h-4" />
                      <span>Overdue</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <CreateTaskModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          fetchTasks();
          setShowCreateModal(false);
        }}
      />
    </div>
  );
}