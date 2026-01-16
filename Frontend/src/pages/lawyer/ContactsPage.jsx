import React, { useState, useEffect } from 'react';
import { Search, Plus, User, Phone, Mail, Filter } from 'lucide-react';
import api from '../../utils/api';
import CreateContactModal from '../../components/modals/CreateContactModal';

export default function ContactsPage() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/contacts');
      setContacts(response.data?.data || []);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = contact.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contact.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || contact.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const contactStats = {
    total: contacts.length,
    clients: contacts.filter(c => c.type === 'client').length,
    witnesses: contacts.filter(c => c.type === 'witness').length,
    others: contacts.filter(c => !['client', 'witness'].includes(c.type)).length
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#181A2A]">Contacts</h1>
          <p className="text-[#737791] mt-1">Manage your client and professional contacts</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-[#28B779] text-white px-4 py-2 rounded-lg hover:bg-[#229966]"
        >
          <Plus className="w-4 h-4" />
          Add Contact
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-[#EBF5FF] to-[#E0EFFF] rounded-xl p-4 relative overflow-hidden border border-[#B8DAFF]">
          <div className="w-[34px] h-[34px] bg-gradient-to-br from-[#0066CC] to-[#0052A3] rounded-full mb-3 flex items-center justify-center shadow-md">
            <User className="w-4 h-4 text-white" />
          </div>
          <h3 className="text-[#0052A3] text-xl font-semibold mb-2">Total Contacts</h3>
          <p className="text-[#0052A3] text-2xl font-bold mb-1">{contactStats.total}</p>
          <div className="absolute bottom-0 right-0 w-16 h-16 bg-[#0066CC]/10 rounded-full -mr-8 -mb-8"></div>
        </div>
        <div className="bg-gradient-to-br from-[#E8F8F0] to-[#D9F3E8] rounded-xl p-4 relative overflow-hidden border border-[#A7E6C8]">
          <div className="w-[34px] h-[34px] bg-gradient-to-br from-[#10B981] to-[#059669] rounded-full mb-3 flex items-center justify-center shadow-md">
            <User className="w-4 h-4 text-white" />
          </div>
          <h3 className="text-[#047857] text-xl font-semibold mb-2">Clients</h3>
          <p className="text-[#047857] text-2xl font-bold mb-1">{contactStats.clients}</p>
          <div className="absolute bottom-0 right-0 w-16 h-16 bg-[#10B981]/10 rounded-full -mr-8 -mb-8"></div>
        </div>
        <div className="bg-gradient-to-br from-[#F0F4FF] to-[#E5EDFF] rounded-xl p-4 relative overflow-hidden border border-[#C7D7FE]">
          <div className="w-[34px] h-[34px] bg-gradient-to-br from-[#6366F1] to-[#4F46E5] rounded-full mb-3 flex items-center justify-center shadow-md">
            <User className="w-4 h-4 text-white" />
          </div>
          <h3 className="text-[#4338CA] text-xl font-semibold mb-2">Witnesses</h3>
          <p className="text-[#4338CA] text-2xl font-bold mb-1">{contactStats.witnesses}</p>
          <div className="absolute bottom-0 right-0 w-16 h-16 bg-[#6366F1]/10 rounded-full -mr-8 -mb-8"></div>
        </div>
        <div className="bg-gradient-to-br from-[#FFF7ED] to-[#FFEDD5] rounded-xl p-4 relative overflow-hidden border border-[#FED7AA]">
          <div className="w-[34px] h-[34px] bg-gradient-to-br from-[#F97316] to-[#EA580C] rounded-full mb-3 flex items-center justify-center shadow-md">
            <User className="w-4 h-4 text-white" />
          </div>
          <h3 className="text-[#C2410C] text-xl font-semibold mb-2">Others</h3>
          <p className="text-[#C2410C] text-2xl font-bold mb-1">{contactStats.others}</p>
          <div className="absolute bottom-0 right-0 w-16 h-16 bg-[#F97316]/10 rounded-full -mr-8 -mb-8"></div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#F8F9FA] shadow-md p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#737791] w-5 h-5" />
            <input
              type="text"
              placeholder="Search contacts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-[#F8F9FA] rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-[#737791]" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-[#F8F9FA] rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="client">Client</option>
              <option value="witness">Witness</option>
              <option value="opposing_counsel">Opposing Counsel</option>
              <option value="expert">Expert</option>
              <option value="vendor">Vendor</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#F8F9FA] shadow-md">
        <div className="p-6 border-b border-[#F8F9FA]">
          <h2 className="text-lg font-semibold text-[#181A2A]">All Contacts ({filteredContacts.length})</h2>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0086CB] mx-auto"></div>
              <p className="text-[#737791] mt-2">Loading contacts...</p>
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="text-center py-8">
              <User className="w-12 h-12 text-[#737791] mx-auto mb-4" />
              <p className="text-[#737791]">No contacts found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredContacts.map((contact) => (
                <div key={contact.id} className="border border-[#F8F9FA] rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 bg-[#EDF3FF] rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-[#186898]" />
                    </div>
                    <span className="px-2 py-1 text-xs rounded-full bg-[#F0F9FF] text-[#0369A1]">
                      {contact.type?.replace('_', ' ') || 'Contact'}
                    </span>
                  </div>
                  <h3 className="font-semibold text-[#181A2A] mb-1">{contact.name}</h3>
                  <div className="space-y-1 text-sm text-[#737791]">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      <span>{contact.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      <span>{contact.phone}</span>
                    </div>
                    {contact.company && (
                      <p className="text-xs">Company: {contact.company}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <CreateContactModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          fetchContacts();
          setShowCreateModal(false);
        }}
      />
    </div>
  );
}