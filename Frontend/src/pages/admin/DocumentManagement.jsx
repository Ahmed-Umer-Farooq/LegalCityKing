import React, { useState, useEffect } from 'react';
import { Database, FileText, FolderOpen, HardDrive, RefreshCw, Search, Download, Eye, Trash2 } from 'lucide-react';
import api from '../../utils/api';
import { showToast } from '../../utils/toastUtils';

const DocumentManagement = () => {
  const [documents, setDocuments] = useState([]);
  const [stats, setStats] = useState({
    totalDocuments: 0,
    totalSize: 0,
    documentTypes: [],
    storageUsage: 0
  });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchDocuments();
    fetchDocumentStats();
  }, [search, filter]);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/management/documents', {
        params: {
          search: search || undefined,
          type: filter === 'all' ? undefined : filter
        }
      });
      setDocuments(response.data?.documents || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
      showToast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const fetchDocumentStats = async () => {
    try {
      const response = await api.get('/admin/document-stats');
      setStats(response.data?.stats || {
        totalDocuments: 0,
        totalSize: 0,
        documentTypes: [],
        storageUsage: 0
      });
    } catch (error) {
      console.error('Error fetching document stats:', error);
    }
  };

  const formatBytes = (bytes) => {
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  };

  const getFileIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'pdf': return '📄';
      case 'doc':
      case 'docx': return '📝';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif': return '🖼️';
      case 'txt': return '📃';
      default: return '📁';
    }
  };

  const handleDeleteDocument = async (documentId) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      try {
        await api.delete(`/admin/documents/${documentId}`);
        showToast.success('Document deleted successfully');
        fetchDocuments();
        fetchDocumentStats();
      } catch (error) {
        showToast.error('Failed to delete document');
      }
    }
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Document Management</h2>
          <p className="text-sm sm:text-base text-gray-600">Manage platform documents and file storage</p>
        </div>
        <button
          onClick={fetchDocuments}
          className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* Storage Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-4 md:p-6">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
            <span className="text-xs sm:text-sm font-semibold text-gray-600">Total Documents</span>
          </div>
          <div className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">{stats.totalDocuments.toLocaleString()}</div>
          <div className="text-xs text-blue-600 font-medium">All file types</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-4 md:p-6">
          <div className="flex items-center gap-2 mb-2">
            <HardDrive className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
            <span className="text-xs sm:text-sm font-semibold text-gray-600">Storage Used</span>
          </div>
          <div className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">{formatBytes(stats.totalSize)}</div>
          <div className="text-xs text-green-600 font-medium">{stats.storageUsage}% of quota</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-4 md:p-6">
          <div className="flex items-center gap-2 mb-2">
            <Database className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
            <span className="text-xs sm:text-sm font-semibold text-gray-600">Document Types</span>
          </div>
          <div className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">{stats.documentTypes.length}</div>
          <div className="text-xs text-purple-600 font-medium">Different formats</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-4 md:p-6">
          <div className="flex items-center gap-2 mb-2">
            <FolderOpen className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
            <span className="text-xs sm:text-sm font-semibold text-gray-600">Avg File Size</span>
          </div>
          <div className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
            {formatBytes(stats.totalDocuments > 0 ? stats.totalSize / stats.totalDocuments : 0)}
          </div>
          <div className="text-xs text-orange-600 font-medium">Per document</div>
        </div>
      </div>

      {/* Document Type Distribution */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-4 md:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6">Document Type Distribution</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {stats.documentTypes.map((docType, index) => {
            const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500'];
            const maxCount = Math.max(...stats.documentTypes.map(d => d.count));
            const percentage = maxCount > 0 ? (docType.count / maxCount) * 100 : 0;
            
            return (
              <div key={index} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium text-gray-900">{docType.type}</span>
                  <span className="text-2xl">{getFileIcon(docType.type)}</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Count:</span>
                    <span className="font-medium">{docType.count.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Size:</span>
                    <span className="font-medium">{formatBytes(docType.size)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${colors[index % colors.length]}`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Document List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Document Library</h3>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Types</option>
                <option value="pdf">PDF</option>
                <option value="doc">Documents</option>
                <option value="image">Images</option>
                <option value="text">Text Files</option>
              </select>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search documents..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full" style={{ minWidth: '800px' }}>
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Size</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Owner</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                    Loading documents...
                  </td>
                </tr>
              ) : documents.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <FileText className="w-12 h-12 text-gray-300" />
                      <p className="text-gray-500">No documents found</p>
                      <p className="text-sm text-gray-400">Documents are stored in backend/uploads/ directory</p>
                    </div>
                  </td>
                </tr>
              ) : (
                documents.map(doc => (
                  <tr key={doc.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{getFileIcon(doc.type)}</span>
                        <span className="font-medium">{doc.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">
                        {doc.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{formatBytes(doc.size)}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{doc.owner}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(doc.created).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Storage Usage */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-4 md:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6">Storage Usage</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Used Storage</span>
            <span className="text-sm font-semibold text-gray-900">
              {formatBytes(stats.totalSize)} / {formatBytes(stats.totalSize / (stats.storageUsage / 100))}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div 
              className={`h-4 rounded-full ${stats.storageUsage >= 90 ? 'bg-red-500' : stats.storageUsage >= 70 ? 'bg-yellow-500' : 'bg-green-500'}`}
              style={{ width: `${stats.storageUsage}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentManagement;