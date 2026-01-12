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