import React, { useState, useEffect } from 'react';
import { Plus, Eye, MessageCircle, Heart, Bookmark, BarChart3, Trash2, Share, Search, Filter, TrendingUp, Users, Calendar, Upload, Image as ImageIcon, X } from 'lucide-react';
import api from '../../utils/api';

const BlogManagement = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [activeView, setActiveView] = useState('overview');
  const [selectedBlog, setSelectedBlog] = useState(null);
  const [blogAnalytics, setBlogAnalytics] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    title: '', content: '', category: '', author_name: '', image: '', imageUrl: '', slug: '',
    meta_title: '', meta_description: '', focus_keyword: '', alt_text: '', tags: ''
  });
  const [currentUser, setCurrentUser] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageUploadType, setImageUploadType] = useState('file'); // 'file' or 'url'

  useEffect(() => {
    fetchBlogs();
  }, []);

  // Generate SEO-friendly slug from title
  const generateSlug = (title) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');
  };

  // Update slug when title changes
  const handleTitleChange = (e) => {
    const title = e.target.value;
    const slug = generateSlug(title);
    setFormData({...formData, title, slug});
  };

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const response = await api.get('/blogs');
      const blogsData = response.data?.data || response.data || [];
      // Use lawyer-specific endpoint that includes secure_id
      const lawyerResponse = await api.get('/blogs/lawyer-blogs');
      const userBlogs = lawyerResponse.data?.blogs || [];
      setBlogs(Array.isArray(userBlogs) ? userBlogs : []);
    } catch (error) {
      console.error('Error fetching blogs:', error);
      setBlogs([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchBlogAnalytics = async (blogId) => {
    try {
      const response = await api.get(`/blogs/${blogId}/analytics`);
      setBlogAnalytics(response.data?.data || null);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setBlogAnalytics(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = new FormData();
      submitData.append('title', formData.title);
      submitData.append('content', formData.content);
      submitData.append('category', formData.category);
      submitData.append('author_name', formData.author_name);
      submitData.append('slug', formData.slug);
      submitData.append('meta_title', formData.meta_title);
      submitData.append('meta_description', formData.meta_description);
      submitData.append('focus_keyword', formData.focus_keyword);
      submitData.append('alt_text', formData.alt_text);
      submitData.append('tags', formData.tags);
      
      if (imageUploadType === 'file' && formData.image) {
        submitData.append('image', formData.image);
      } else if (imageUploadType === 'url' && formData.imageUrl) {
        submitData.append('imageUrl', formData.imageUrl);
      }
      
      await api.post('/blogs', submitData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      alert('Blog created successfully!');
      setShowCreateForm(false);
      setFormData({ title: '', content: '', category: '', author_name: currentUser?.name || '', image: '', imageUrl: '', slug: '',
        meta_title: '', meta_description: '', focus_keyword: '', alt_text: '', tags: '' });
      setImagePreview(null);
      fetchBlogs();
    } catch (error) {
      console.error('Blog creation error:', error);
      alert('Failed to create blog: ' + (error.response?.data?.message || 'Unknown error'));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this blog?')) {
      try {
        await api.delete(`/blogs/${id}`);
        alert('Blog deleted!');
        fetchBlogs();
      } catch (error) {
        alert('Failed to delete blog');
      }
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (window.confirm('Delete this comment?')) {
      try {
        await api.delete(`/blogs/comments/${commentId}/moderate`);
        fetchBlogAnalytics(selectedBlog.id);
        alert('Comment deleted!');
      } catch (error) {
        alert('Failed to delete comment');
      }
    }
  };

  const formatTimeAgo = (dateString) => {
    const hours = Math.floor((new Date() - new Date(dateString)) / (1000 * 60 * 60));
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    if (hours < 168) return `${Math.floor(hours / 24)}d ago`;
    return new Date(dateString).toLocaleDateString();
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
        setFormData({...formData, image: file, imageUrl: e.target.result});
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUrl = (url) => {
    setFormData({...formData, imageUrl: url});
    setImagePreview(url);
  };

  const removeImage = () => {
    setImagePreview(null);
    setFormData({...formData, image: '', imageUrl: ''});
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Corporate Law': 'bg-blue-100 text-blue-800',
      'Family Law': 'bg-pink-100 text-pink-800',
      'Criminal Law': 'bg-red-100 text-red-800',
      'Real Estate Law': 'bg-green-100 text-green-800',
      'Immigration Law': 'bg-purple-100 text-purple-800',
      'Tax Law': 'bg-yellow-100 text-yellow-800',
      'Employment Law': 'bg-indigo-100 text-indigo-800',
      'Intellectual Property': 'bg-cyan-100 text-cyan-800',
      'Personal Injury': 'bg-orange-100 text-orange-800',
      'Estate Planning': 'bg-gray-100 text-gray-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const getPlaceholderImage = (category, blogId) => {
    const seeds = {
      'Corporate Law': 'legal-corporate',
      'Family Law': 'legal-family', 
      'Criminal Law': 'legal-criminal',
      'Real Estate Law': 'legal-realestate',
      'Immigration Law': 'legal-immigration',
      'Tax Law': 'legal-tax',
      'Employment Law': 'legal-employment',
      'Intellectual Property': 'legal-ip',
      'Personal Injury': 'legal-injury',
      'Estate Planning': 'legal-estate'
    };
    const seed = seeds[category] || 'legal';
    return `https://picsum.photos/400/200?seed=${seed}${blogId}`;
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath || imagePath.trim() === '' || imagePath === 'null' || imagePath === null) return null;
    if (imagePath.startsWith('http')) return imagePath;
    if (imagePath.startsWith('/uploads/')) return `http://localhost:5001${imagePath}`;
    return `http://localhost:5001/uploads/${imagePath}`;
  };

  const filteredBlogs = blogs.filter(blog => 
    blog.title && blog.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl p-8 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 mb-2">My Blogs</h2>
            <p className="text-slate-600 text-lg">Share your legal expertise and build your professional presence</p>
            <div className="flex items-center gap-6 mt-4">
              <div className="flex items-center gap-2 text-slate-500">
                <span className="text-sm font-medium">{blogs.length} Published</span>
              </div>
              <div className="flex items-center gap-2 text-slate-500">
                <Eye className="w-4 h-4" />
                <span className="text-sm font-medium">{blogs.reduce((sum, blog) => sum + (blog.views_count || 0), 0)} Total Views</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center gap-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-8 py-4 rounded-2xl hover:from-blue-700 hover:to-indigo-800 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 font-semibold text-lg"
          >
            <Plus className="w-5 h-5" />
            Create New Blog
          </button>
        </div>
      </div>

      {/* Navigation */}
      {selectedBlog && (
        <div className="bg-white rounded-xl shadow-sm border">
          <nav className="flex space-x-1 p-1">
            <button
              onClick={() => { setActiveView('overview'); setSelectedBlog(null); }}
              className={`py-3 px-6 rounded-lg font-medium text-sm transition-all duration-200 ${
                activeView === 'overview' 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              Back to Blogs
            </button>
            <button
              onClick={() => setActiveView('analytics')}
              className={`py-3 px-6 rounded-lg font-medium text-sm transition-all duration-200 ${
                activeView === 'analytics' 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              Analytics: {selectedBlog.title ? selectedBlog.title.substring(0, 20) + '...' : 'Blog'}
            </button>
          </nav>
        </div>
      )}

      {/* Create Form */}
      {showCreateForm && (
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-5">
            <h3 className="text-2xl font-bold text-white mb-1">Create New Blog</h3>
            <p className="text-blue-100 text-base">Share your legal expertise with the community</p>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Author & Title Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-800 mb-3">Author Name *</label>
                <input
                  type="text"
                  placeholder="Enter author name"
                  value={formData.author_name}
                  onChange={(e) => setFormData({...formData, author_name: e.target.value})}
                  required
                  className="w-full px-5 py-4 border-2 border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-300 text-slate-700 font-medium shadow-sm hover:shadow-md"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-800 mb-3">Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  required
                  className="w-full px-5 py-4 border-2 border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-300 text-slate-700 font-medium shadow-sm hover:shadow-md"
                >
                  <option value="">Select Legal Category</option>
                  <option value="Corporate Law">Corporate Law</option>
                  <option value="Family Law">Family Law</option>
                  <option value="Criminal Law">Criminal Law</option>
                  <option value="Real Estate Law">Real Estate Law</option>
                  <option value="Immigration Law">Immigration Law</option>
                  <option value="Tax Law">Tax Law</option>
                  <option value="Employment Law">Employment Law</option>
                  <option value="Intellectual Property">Intellectual Property</option>
                  <option value="Personal Injury">Personal Injury</option>
                  <option value="Estate Planning">Estate Planning</option>
                </select>
              </div>
            </div>

            {/* Blog Title & Slug */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-800 mb-3">Blog Title *</label>
                <input
                  type="text"
                  placeholder="Enter an engaging blog title"
                  value={formData.title}
                  onChange={handleTitleChange}
                  required
                  className="w-full px-5 py-4 border-2 border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-300 text-slate-700 font-medium shadow-sm hover:shadow-md"
                />
                <p className="text-sm text-slate-500 mt-2 font-medium">{formData.title.length}/100 characters</p>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-800 mb-3">SEO Slug</label>
                <input
                  type="text"
                  placeholder="auto-generated-from-title"
                  value={formData.slug}
                  onChange={(e) => setFormData({...formData, slug: e.target.value})}
                  className="w-full px-5 py-4 border-2 border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-300 text-slate-700 font-medium shadow-sm hover:shadow-md bg-slate-50"
                  readOnly
                />
                <p className="text-sm text-slate-500 mt-2 font-medium">Auto-generated SEO-friendly URL</p>
              </div>
            </div>

            {/* SEO Fields */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
              <h4 className="text-lg font-bold text-green-800 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                SEO Optimization
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-slate-800 mb-3">Meta Title</label>
                  <input
                    type="text"
                    placeholder="SEO optimized title (50-60 chars)"
                    value={formData.meta_title}
                    onChange={(e) => setFormData({...formData, meta_title: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-green-200 rounded-xl focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all duration-300 text-slate-700 font-medium shadow-sm hover:shadow-md"
                  />
                  <p className="text-sm text-green-600 font-medium">{formData.meta_title.length}/60 characters</p>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-slate-800 mb-3">Focus Keyword</label>
                  <input
                    type="text"
                    placeholder="Primary SEO keyword"
                    value={formData.focus_keyword}
                    onChange={(e) => setFormData({...formData, focus_keyword: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-green-200 rounded-xl focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all duration-300 text-slate-700 font-medium shadow-sm hover:shadow-md"
                  />
                </div>
              </div>
              <div className="mt-6 space-y-2">
                <label className="block text-sm font-bold text-slate-800 mb-3">Meta Description</label>
                <textarea
                  placeholder="Brief description for search results (150-160 chars)"
                  value={formData.meta_description}
                  onChange={(e) => setFormData({...formData, meta_description: e.target.value})}
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-green-200 rounded-xl focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all duration-300 text-slate-700 font-medium shadow-sm hover:shadow-md resize-none"
                />
                <p className="text-sm text-green-600 font-medium">{formData.meta_description.length}/160 characters</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-slate-800 mb-3">Image Alt Text</label>
                  <input
                    type="text"
                    placeholder="Descriptive alt text for image"
                    value={formData.alt_text}
                    onChange={(e) => setFormData({...formData, alt_text: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-green-200 rounded-xl focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all duration-300 text-slate-700 font-medium shadow-sm hover:shadow-md"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-slate-800 mb-3">Tags/Keywords</label>
                  <input
                    type="text"
                    placeholder="tag1, tag2, tag3"
                    value={formData.tags}
                    onChange={(e) => setFormData({...formData, tags: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-green-200 rounded-xl focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all duration-300 text-slate-700 font-medium shadow-sm hover:shadow-md"
                  />
                  <p className="text-sm text-green-600 font-medium">Separate with commas</p>
                </div>
              </div>
            </div>

            {/* Image Upload Section */}
            <div className="space-y-3">
              <label className="block text-sm font-bold text-slate-800 mb-4">Blog Image</label>
              <div className="border-3 border-dashed border-blue-200 rounded-3xl p-8 bg-gradient-to-br from-blue-50 to-indigo-50">
                {/* Upload Type Toggle */}
                <div className="flex gap-4 mb-4">
                  <button
                    type="button"
                    onClick={() => setImageUploadType('url')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      imageUploadType === 'url' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                    }`}
                  >
                    Image URL
                  </button>
                </div>

                {imageUploadType === 'file' ? (
                  <div 
                    className="text-center border-2 border-dashed border-blue-300 rounded-lg p-8 hover:border-blue-400 transition-colors duration-200"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const file = e.dataTransfer.files[0];
                      if (file && file.type.startsWith('image/')) {
                        const reader = new FileReader();
                        reader.onload = (e) => {
                          setImagePreview(e.target.result);
                          setFormData({...formData, image: file, imageUrl: e.target.result});
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                    />
                    <ImageIcon className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                    <p className="text-lg font-medium text-slate-700 mb-2">Drag & drop your image here</p>
                    <p className="text-sm text-slate-500 mb-4">or</p>
                    <label
                      htmlFor="image-upload"
                      className="cursor-pointer inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
                    >
                      <Upload className="w-4 h-4" />
                      Choose Image
                    </label>
                    <p className="text-xs text-slate-500 mt-3">PNG, JPG, GIF up to 10MB</p>
                  </div>
                ) : (
                  <input
                    type="url"
                    placeholder="Enter image URL (https://...)"
                    value={formData.imageUrl}
                    onChange={(e) => handleImageUrl(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                )}

                {/* Image Preview */}
                {imagePreview && (
                  <div className="mt-4 relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-lg border border-slate-200"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors duration-200"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Blog Content */}
            <div className="space-y-3">
              <label className="block text-sm font-bold text-slate-800 mb-3">Blog Content *</label>
              <textarea
                placeholder="Write your blog content here..."
                value={formData.content}
                onChange={(e) => setFormData({...formData, content: e.target.value})}
                required
                rows={10}
                className="w-full px-5 py-4 border-2 border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-300 text-slate-700 font-medium shadow-sm hover:shadow-md resize-none"
              />
              <p className="text-sm text-slate-500 mt-2 font-medium">{formData.content.length} characters</p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-6 border-t border-slate-100">
              <button 
                type="submit" 
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-10 py-4 rounded-2xl hover:from-blue-700 hover:to-indigo-800 transition-all duration-300 font-bold text-lg shadow-xl hover:shadow-2xl transform hover:-translate-y-1 hover:scale-105"
              >
                Publish Blog
              </button>
              <button 
                type="button" 
                onClick={() => setShowCreateForm(false)} 
                className="px-10 py-4 bg-slate-200 text-slate-700 rounded-2xl hover:bg-slate-300 transition-all duration-300 font-bold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main Content */}
      {activeView === 'overview' && (
        <>
          {/* Search */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search your blogs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 pr-4 py-3 w-full border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              />
            </div>
          </div>

          {/* Blogs Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-pulse">
                  <div className="aspect-video bg-slate-200"></div>
                  <div className="p-6">
                    <div className="h-4 bg-slate-200 rounded mb-4"></div>
                    <div className="h-3 bg-slate-200 rounded mb-2"></div>
                    <div className="h-3 bg-slate-200 rounded w-2/3"></div>
                    <div className="flex gap-4 mt-4">
                      <div className="h-8 bg-slate-200 rounded flex-1"></div>
                      <div className="h-8 bg-slate-200 rounded w-16"></div>
                    </div>
                  </div>
                </div>
              ))
            ) : filteredBlogs.length === 0 ? (
              <div className="col-span-full text-center py-16">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                  <BarChart3 className="w-12 h-12 text-blue-500" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">No blogs found</h3>
                <p className="text-slate-600 mb-6">Create your first blog to start sharing your legal expertise!</p>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-semibold"
                >
                  Create Your First Blog
                </button>
              </div>
            ) : (
              filteredBlogs.map((blog) => (
                <div key={blog.secure_id} className="bg-white rounded-2xl shadow-lg border border-slate-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden group">
                  <div className="aspect-video bg-gradient-to-br from-slate-100 to-blue-50 relative overflow-hidden">
                    <img 
                      src={getImageUrl(blog.featured_image) || getPlaceholderImage(blog.category, blog.secure_id)} 
                      alt={blog.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        if (!e.target.src.includes('picsum.photos')) {
                          e.target.src = getPlaceholderImage(blog.category, blog.secure_id);
                        }
                      }}
                    />
                    <div className="absolute top-4 left-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getCategoryColor(blog.category || 'General')}`}>
                        {blog.category || 'General'}
                      </span>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="font-bold text-lg text-slate-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors duration-200">
                      {blog.title || 'Untitled Blog'}
                    </h3>
                    <p className="text-slate-600 text-sm mb-4 line-clamp-2">
                      {blog.excerpt ? blog.excerpt.substring(0, 120) + '...' : 'No content available'}
                    </p>
                    <div className="flex items-center justify-between text-sm text-slate-500 mb-4">
                      <span className="font-medium">{blog.author_name || 'Unknown Author'}</span>
                      <span>{blog.published_at ? formatTimeAgo(blog.published_at) : 'Unknown Date'}</span>
                    </div>
                    
                    {/* Metrics */}
                    <div className="grid grid-cols-4 gap-3 mb-4">
                      <div className="text-center p-2 bg-slate-50 rounded-lg">
                        <Eye className="w-4 h-4 text-blue-500 mx-auto mb-1" />
                        <div className="text-xs font-semibold text-slate-700">{blog.views_count || 0}</div>
                      </div>
                      <div className="text-center p-2 bg-slate-50 rounded-lg">
                        <Heart className="w-4 h-4 text-red-500 mx-auto mb-1" />
                        <div className="text-xs font-semibold text-slate-700">{blog.like_count || 0}</div>
                      </div>
                      <div className="text-center p-2 bg-slate-50 rounded-lg">
                        <MessageCircle className="w-4 h-4 text-green-500 mx-auto mb-1" />
                        <div className="text-xs font-semibold text-slate-700">{blog.comment_count || 0}</div>
                      </div>
                      <div className="text-center p-2 bg-slate-50 rounded-lg">
                        <Bookmark className="w-4 h-4 text-purple-500 mx-auto mb-1" />
                        <div className="text-xs font-semibold text-slate-700">0</div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedBlog(blog);
                          setActiveView('analytics');
                          fetchBlogAnalytics(blog.secure_id);
                        }}
                        className="flex-1 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 px-4 py-2 rounded-lg hover:from-blue-100 hover:to-blue-200 transition-all duration-200 text-sm font-semibold flex items-center justify-center gap-2"
                      >
                        <BarChart3 className="w-4 h-4" />
                        Analytics
                      </button>
                      <button
                        onClick={() => handleDelete(blog.secure_id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {activeView === 'analytics' && selectedBlog && (
        <div className="space-y-8">
          {/* Analytics Header */}
          <div className="bg-gradient-to-r from-white to-blue-50 rounded-2xl shadow-lg border border-slate-200 p-8">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">{selectedBlog.title || 'Untitled Blog'}</h3>
                <p className="text-slate-600 flex items-center gap-2">
                  <span>Published by {selectedBlog.author_name || 'Unknown Author'}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {selectedBlog.published_at ? formatTimeAgo(selectedBlog.published_at) : 'Unknown Date'}
                  </span>
                </p>
              </div>
              <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getCategoryColor(selectedBlog.category || 'General')}`}>
                {selectedBlog.category || 'General'}
              </span>
            </div>
          </div>

          {blogAnalytics ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm font-medium">Total Views</p>
                      <p className="text-3xl font-bold mt-1">{blogAnalytics.metrics?.views_count || 0}</p>
                    </div>
                    <Eye className="w-8 h-8" />
                  </div>
                </div>
                <div className="bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl shadow-lg p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-red-100 text-sm font-medium">Likes</p>
                      <p className="text-3xl font-bold mt-1">{blogAnalytics.metrics?.like_count || 0}</p>
                    </div>
                    <Heart className="w-8 h-8" />
                  </div>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-sm font-medium">Comments</p>
                      <p className="text-3xl font-bold mt-1">{blogAnalytics.metrics?.comment_count || 0}</p>
                    </div>
                    <MessageCircle className="w-8 h-8" />
                  </div>
                </div>
                <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl shadow-lg p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm font-medium">Saves</p>
                      <p className="text-3xl font-bold mt-1">{blogAnalytics.metrics?.save_count || 0}</p>
                    </div>
                    <Bookmark className="w-8 h-8" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 border-b border-slate-200">
                    <h4 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                      <MessageCircle className="w-5 h-5 text-green-500" />
                      Recent Comments ({blogAnalytics.comments?.length || 0})
                    </h4>
                  </div>
                  <div className="p-6">
                    {blogAnalytics.comments?.length > 0 ? (
                      <div className="space-y-4 max-h-96 overflow-y-auto">
                        {blogAnalytics.comments.map((comment) => (
                          <div key={comment.id} className="bg-slate-50 rounded-xl p-4">
                            <div className="flex items-start gap-4">
                              <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                {comment.user_name?.charAt(0) || 'U'}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-2">
                                  <p className="font-semibold text-slate-900">{comment.user_name}</p>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-slate-500 bg-white px-2 py-1 rounded-full">
                                      {formatTimeAgo(comment.created_at)}
                                    </span>
                                    <button
                                      onClick={() => handleDeleteComment(comment.id)}
                                      className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                                <p className="text-slate-700 text-sm">{comment.comment_text}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <MessageCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                        <p className="text-slate-500">No comments yet</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-red-50 to-pink-50 p-6 border-b border-slate-200">
                      <h4 className="text-lg font-bold text-slate-900 flex items-center gap-3">
                        <Heart className="w-4 h-4 text-red-500" />
                        Liked by ({blogAnalytics.likes?.length || 0})
                      </h4>
                    </div>
                    <div className="p-6">
                      {blogAnalytics.likes?.length > 0 ? (
                        <div className="space-y-3 max-h-48 overflow-y-auto">
                          {blogAnalytics.likes.map((user, index) => (
                            <div key={index} className="flex items-center gap-3 p-3 hover:bg-red-50 rounded-xl">
                              <div className="w-8 h-8 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                                {user.name?.charAt(0) || 'U'}
                              </div>
                              <span className="text-slate-700 font-medium">{user.name}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-slate-500 text-center py-4">No likes yet</p>
                      )}
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-6 border-b border-slate-200">
                      <h4 className="text-lg font-bold text-slate-900 flex items-center gap-3">
                        <Bookmark className="w-4 h-4 text-purple-500" />
                        Saved by ({blogAnalytics.saves?.length || 0})
                      </h4>
                    </div>
                    <div className="p-6">
                      {blogAnalytics.saves?.length > 0 ? (
                        <div className="space-y-3 max-h-48 overflow-y-auto">
                          {blogAnalytics.saves.map((user, index) => (
                            <div key={index} className="flex items-center gap-3 p-3 hover:bg-purple-50 rounded-xl">
                              <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                                {user.name?.charAt(0) || 'U'}
                              </div>
                              <span className="text-slate-700 font-medium">{user.name}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-slate-500 text-center py-4">No saves yet</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-16 text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-6"></div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Loading Analytics</h3>
              <p className="text-slate-500">Gathering insights about your blog performance...</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BlogManagement;
