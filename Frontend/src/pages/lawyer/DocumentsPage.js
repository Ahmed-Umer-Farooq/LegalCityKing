import React, { useState, useEffect } from 'react';
import { Upload, File, Search, Filter, FolderOpen, Download } from 'lucide-react';
import { showToast } from '../../utils/toastUtils';
import api from '../../utils/api';

export default function DocumentsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [uploading, setUploading] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const fileInputRef = React.useRef(null);

  // Fetch documents from API
  const fetchDocuments = async () => {
    try {
      setLoading(true);
      console.log('Fetching documents from API...');
      const response = await api.get('/documents');
      console.log('Documents API response:', response.data);
      if (response.data.success) {
        setDocuments(response.data.data);
        console.log('Documents loaded:', response.data.data.length);
      } else {
        console.error('API returned success: false');
        showToast.error('Failed to load documents');
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
      if (error.response?.status === 401) {
        showToast.error('Please log in to view documents');
      } else {
        showToast.error('Failed to load documents');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      console.log('Uploading file:', file.name);
      const formData = new FormData();
      formData.append('document', file);
      formData.append('category', 'other');
      
      const response = await api.post('/documents', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      console.log('Upload response:', response.data);
      if (response.data.success) {
        showToast.success(`File "${file.name}" uploaded successfully!`);
        fetchDocuments(); // Refresh the documents list
      } else {
        showToast.error('Upload failed: ' + (response.data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Upload error:', error);
      if (error.response?.status === 401) {
        showToast.error('Please log in to upload documents');
      } else {
        showToast.error('Failed to upload file: ' + (error.response?.data?.error || error.message));
      }
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleDownload = async (documentId, fileName) => {
    try {
      const response = await api.get(`/documents/${documentId}/download`, {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      showToast.error('Failed to download file');
    }
  };

  const getFileIcon = (type) => {
    return <File className="w-5 h-5 text-[#737791]" />;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileExtension = (filename) => {
    return filename.split('.').pop().toLowerCase();
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.file_name.toLowerCase().includes(searchTerm.toLowerCase());
    const fileExt = getFileExtension(doc.file_name);
    const matchesFilter = filterType === 'all' || fileExt === filterType || 
      (filterType === 'docx' && (fileExt === 'doc' || fileExt === 'docx')) ||
      (filterType === 'jpg' && (fileExt === 'jpg' || fileExt === 'jpeg' || fileExt === 'png'));
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#181A2A]">Documents</h1>
          <p className="text-[#737791] mt-1">Manage your legal documents and files</p>
        </div>
        <button 
          onClick={handleUploadClick}
          disabled={uploading}
          className="flex items-center gap-2 bg-[#28B779] text-white px-4 py-2 rounded-lg hover:bg-[#229966] disabled:opacity-50"
        >
          <Upload className="w-4 h-4" />
          {uploading ? 'Uploading...' : 'Upload Document'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileUpload}
          className="hidden"
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.zip,.txt"
        />
      </div>

      <div className="bg-white rounded-2xl border border-[#F8F9FA] shadow-md p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#737791] w-5 h-5" />
            <input
              type="text"
              placeholder="Search documents..."
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
              <option value="pdf">PDF</option>
              <option value="docx">Word</option>
              <option value="zip">Archive</option>
              <option value="jpg">Image</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 bg-white rounded-2xl border border-[#F8F9FA] shadow-md">
          <div className="p-6 border-b border-[#F8F9FA]">
            <h2 className="text-lg font-semibold text-[#181A2A]">All Documents ({filteredDocuments.length})</h2>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="text-center py-8">
                <p className="text-[#737791]">Loading documents...</p>
              </div>
            ) : filteredDocuments.length === 0 ? (
              <div className="text-center py-8">
                <FolderOpen className="w-12 h-12 text-[#737791] mx-auto mb-4" />
                <p className="text-[#737791]">No documents found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredDocuments.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-4 border border-[#F8F9FA] rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3">
                      {getFileIcon(getFileExtension(doc.file_name))}
                      <div>
                        <h3 className="font-medium text-[#181A2A]">{doc.file_name}</h3>
                        <div className="flex items-center gap-4 text-sm text-[#737791]">
                          <span>{formatFileSize(doc.file_size)}</span>
                          <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                          <span>{doc.case_title || 'No Case'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleDownload(doc.id, doc.file_name)}
                        className="p-2 text-[#737791] hover:text-[#0086CB] hover:bg-[#F8F9FA] rounded"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#F8F9FA] shadow-md">
          <div className="p-6 border-b border-[#F8F9FA]">
            <h2 className="text-lg font-semibold text-[#181A2A]">Quick Stats</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="text-center p-4 border border-[#F8F9FA] rounded-lg">
              <h3 className="text-xl font-bold text-[#181A2A]">{documents.length}</h3>
              <p className="text-[#737791] text-sm">Total Documents</p>
            </div>
            <div className="text-center p-4 border border-[#F8F9FA] rounded-lg">
              <h3 className="text-xl font-bold text-[#181A2A]">
                {formatFileSize(documents.reduce((total, doc) => total + (doc.file_size || 0), 0))}
              </h3>
              <p className="text-[#737791] text-sm">Storage Used</p>
            </div>
            <div className="text-center p-4 border border-[#F8F9FA] rounded-lg">
              <h3 className="text-xl font-bold text-[#181A2A]">3</h3>
              <p className="text-[#737791] text-sm">Active Cases</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#F8F9FA] shadow-md p-6">
        <h2 className="text-lg font-semibold text-[#181A2A] mb-4">Recent Activity</h2>
        <div className="space-y-3">
          {documents.slice(0, 3).map((doc) => (
            <div key={doc.id} className="flex items-center gap-3 p-3 border border-[#F8F9FA] rounded-lg">
              <Upload className="w-5 h-5 text-[#28B779]" />
              <div>
                <p className="text-sm font-medium text-[#181A2A]">{doc.file_name} uploaded</p>
                <p className="text-xs text-[#737791]">{new Date(doc.created_at).toLocaleString()}</p>
              </div>
            </div>
          ))}
          {documents.length === 0 && (
            <p className="text-[#737791] text-sm">No recent activity</p>
          )}
        </div>
      </div>
    </div>
  );
}