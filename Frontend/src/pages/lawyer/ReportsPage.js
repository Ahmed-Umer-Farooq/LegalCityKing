import React, { useState, useEffect } from 'react';
import { BarChart3, FileText, Users, Clock, DollarSign, Phone, MessageCircle, File } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../utils/api';

export default function ReportsPage() {
  const [data, setData] = useState({
    cases: [],
    contacts: [],
    tasks: [],
    events: [],
    notes: [],
    calls: [],
    messages: [],
    payments: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [
        casesRes, contactsRes, tasksRes, eventsRes, notesRes,
        callsRes, messagesRes, paymentsRes
      ] = await Promise.all([
        api.get('/cases').catch(() => ({ data: { data: [] } })),
        api.get('/contacts').catch(() => ({ data: { data: [] } })),
        api.get('/tasks').catch(() => ({ data: { data: [] } })),
        api.get('/events').catch(() => ({ data: { data: [] } })),
        api.get('/notes').catch(() => ({ data: { data: [] } })),
        api.get('/calls').catch(() => ({ data: { data: [] } })),
        api.get('/messages').catch(() => ({ data: { data: [] } })),
        api.get('/payments').catch(() => ({ data: { data: [] } }))
      ]);

      setData({
        cases: casesRes.data?.data || [],
        contacts: contactsRes.data?.data || [],
        tasks: tasksRes.data?.data || [],
        events: eventsRes.data?.data || [],
        notes: notesRes.data?.data || [],
        calls: callsRes.data?.data || [],
        messages: messagesRes.data?.data || [],
        payments: paymentsRes.data?.data || []
      });
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, count, icon: Icon, color, items, onViewAll, onItemClick }) => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <p className="text-3xl font-bold" style={{ color }}>{count}</p>
        </div>
        <Icon className="w-8 h-8" style={{ color }} />
      </div>
      {items.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-600">Recent:</p>
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('View All clicked');
                if (onViewAll) {
                  onViewAll();
                } else {
                  toast.info('View All clicked!');
                }
              }}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium cursor-pointer px-2 py-1 rounded hover:bg-blue-50"
            >
              View All
            </button>
          </div>
          {items.slice(0, 3).map((item, index) => (
            <div 
              key={index} 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Item clicked:', item);
                if (onItemClick) {
                  onItemClick(item);
                } else {
                  toast.info(`Item: ${item.title || item.name || item.subject || item.description || 'Untitled'}`);
                }
              }}
              className="text-sm text-gray-500 truncate hover:text-gray-700 cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors border border-transparent hover:border-gray-200"
              style={{ userSelect: 'none' }}
            >
              • {item.title || item.name || item.subject || item.description || 'Untitled'}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
        <p className="text-gray-600">Overview of all your Quick Actions data</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Cases"
          count={data.cases.length}
          icon={FileText}
          color="#3B82F6"
          items={data.cases}
          onViewAll={() => toast.info('Navigate to Cases page - Click "Home" then scroll to Cases Management section')}
          onItemClick={(item) => toast.info(`Case: ${item.title}\nType: ${item.type}\nStatus: ${item.status}\nFiled: ${item.filing_date}`)}
        />
        <StatCard
          title="Contacts"
          count={data.contacts.length}
          icon={Users}
          color="#10B981"
          items={data.contacts}
          onViewAll={() => toast.info('Click "Contacts" in the navigation menu to view all contacts')}
          onItemClick={(item) => toast.info(`Contact: ${item.name}\nCompany: ${item.company || 'N/A'}\nType: ${item.type}\nEmail: ${item.email || 'N/A'}\nPhone: ${item.phone || 'N/A'}`)}
        />
        <StatCard
          title="Tasks"
          count={data.tasks.length}
          icon={BarChart3}
          color="#F59E0B"
          items={data.tasks}
          onViewAll={() => toast.info('Click "Tasks" in the navigation menu to view all tasks')}
          onItemClick={(item) => toast.info(`Task: ${item.title}\nPriority: ${item.priority}\nStatus: ${item.status}\nDue: ${item.due_date || 'No due date'}\nDescription: ${item.description || 'No description'}`)}
        />
        <StatCard
          title="Events"
          count={data.events.length}
          icon={Clock}
          color="#EF4444"
          items={data.events}
          onViewAll={() => toast.info('Click "Calendar" in the navigation menu to view all events')}
          onItemClick={(item) => toast.info(`Event: ${item.title}\nType: ${item.event_type}\nDate: ${item.start_date}\nTime: ${item.start_time} - ${item.end_time}\nLocation: ${item.location || 'No location'}`)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title="Notes"
          count={data.notes.length}
          icon={File}
          color="#8B5CF6"
          items={data.notes}
          onViewAll={() => toast.info('Notes list coming soon! For now, notes are created via Quick Actions.')}
          onItemClick={(item) => toast.info(`Note: ${item.title}\nPrivate: ${item.is_private ? 'Yes' : 'No'}\nContent: ${item.content}`)}
        />
        <StatCard
          title="Calls"
          count={data.calls.length}
          icon={Phone}
          color="#06B6D4"
          items={data.calls}
          onViewAll={() => toast.info('Call logs list coming soon! For now, calls are logged via Quick Actions.')}
          onItemClick={(item) => toast.info(`Call: ${item.title}\nType: ${item.call_type}\nDate: ${item.call_date}\nDuration: ${item.duration_minutes} minutes\nBillable: ${item.is_billable ? 'Yes' : 'No'}`)}
        />
        <StatCard
          title="Messages"
          count={data.messages.length}
          icon={MessageCircle}
          color="#84CC16"
          items={data.messages}
          onViewAll={() => toast.info('Click "Messages" in the navigation menu to view all messages')}
          onItemClick={(item) => toast.info(`Message: ${item.subject}\nType: ${item.message_type}\nContent: ${item.content}`)}
        />
      </div>

      {/* Financial Overview */}
      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Payments</h3>
              <p className="text-3xl font-bold text-green-600">{data.payments.length}</p>
              <p className="text-sm text-gray-500">
                Total: ${data.payments.reduce((sum, pay) => sum + (parseFloat(pay.amount) || 0), 0).toFixed(2)}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-green-600" />
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
        </div>
        <div className="p-6">
          {Object.keys(data).every(key => data[key].length === 0) ? (
            <div className="text-center py-8 text-gray-500">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>No data found. Start using Quick Actions to see your activity here!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Show recent items from all categories */}
              {[...data.cases, ...data.contacts, ...data.tasks, ...data.events, ...data.notes, ...data.calls]
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                .slice(0, 10)
                .map((item, index) => (
                  <div 
                    key={index} 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const details = `Title: ${item.title || item.name || item.subject || 'Untitled'}\nDescription: ${item.description || item.email || item.content || 'No description'}\nCreated: ${new Date(item.created_at).toLocaleDateString()}`;
                      toast.info(details);
                    }}
                    className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 cursor-pointer rounded px-2 transition-colors border border-transparent hover:border-gray-200"
                    style={{ userSelect: 'none' }}
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {item.title || item.name || item.subject || 'Untitled'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {item.description || item.email || item.content || 'No description'}
                      </p>
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}