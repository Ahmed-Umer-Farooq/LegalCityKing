import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Flag } from 'lucide-react';
import CommentCount from '../../components/CommentCount';
import ReportBlogModal from '../../components/modals/ReportBlogModal';

const Blog = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reportModal, setReportModal] = useState({ isOpen: false, blogId: null, blogTitle: '' });
  
  const getImageUrl = (imagePath) => {
    if (!imagePath || imagePath.trim() === '' || imagePath === 'null' || imagePath === null) return null;
    if (imagePath.startsWith('http')) return imagePath;
    if (imagePath.startsWith('/uploads/')) return `http://localhost:5001${imagePath}`;
    return `http://localhost:5001/uploads/${imagePath}`;
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

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      const response = await fetch('/api/blogs');
      if (response.ok) {
        const data = await response.json();
        const transformedBlogs = data.map(blog => ({
          id: blog.id,
          secure_id: blog.secure_id,
          slug: blog.slug,
          title: blog.title,
          category: blog.category || 'General',
          author: blog.author_name || 'Unknown Author',
          date: new Date(blog.published_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }),
          image: getImageUrl(blog.featured_image) || getPlaceholderImage(blog.category || 'General', blog.secure_id),
          comment_count: parseInt(blog.comment_count) || 0
        }));
        setBlogs(transformedBlogs);
      }
    } catch (error) {
      console.error('Error fetching blogs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBlogClick = (blog) => {
    // Navigate to dashboard blog view format using secure_id
    const slug = blog.slug || blog.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    navigate(`/user/legal-blog/${slug}/${blog.secure_id}`, { state: { from: 'user-dashboard' } });
  };

  const handleViewAllBlogs = () => {
    navigate('/dashboard/my-blog-posts');
  };

  const filteredBlogs = blogs.filter(blog =>
    blog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    blog.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    blog.author.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-center mb-6">
        <h1 className="text-2xl font-bold text-blue-800">Legal City</h1>
      </div>

      {/* Search Section */}
      <div className="bg-white rounded-lg border border-gray-100 p-4">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search blogs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Search Blogs
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Latest Blogs</h2>
          
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg border border-gray-100 overflow-hidden animate-pulse">
                  <div className="w-full h-48 bg-gray-200"></div>
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {filteredBlogs.map(blog => (
                <div 
                  key={blog.id} 
                  onClick={() => handleBlogClick(blog)}
                  className="bg-white rounded-lg border border-gray-100 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                >
                  <img 
                    src={blog.image} 
                    alt={blog.title}
                    className="w-full h-48 object-cover"
                    onError={(e) => {
                      if (!e.target.src.includes('picsum.photos')) {
                        e.target.src = getPlaceholderImage(blog.category, blog.id);
                      }
                    }}
                  />
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                        {blog.category}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setReportModal({ isOpen: true, blogId: blog.id, blogTitle: blog.title });
                        }}
                        className="text-gray-400 hover:text-red-500 p-1 rounded transition-colors"
                        title="Report this blog"
                      >
                        <Flag className="w-4 h-4" />
                      </button>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{blog.title}</h3>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <span>{blog.author}</span>
                        <span>•</span>
                        <span>{blog.date}</span>
                      </div>
                      <CommentCount count={blog.comment_count} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="text-center">
            <button 
              onClick={handleViewAllBlogs}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              View All Blogs
            </button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Categories */}
          <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-4">
              <h3 className="text-white font-semibold">Categories</h3>
            </div>
            <div className="p-4">
              <p className="text-gray-500 text-sm">No categories available</p>
            </div>
          </div>

          {/* Top Authors */}
          <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-4">
              <h3 className="text-white font-semibold">Top Authors</h3>
            </div>
            <div className="p-4 space-y-4">
              {['Sarah Johnson', 'Michael Chen', 'Emily Rodriguez'].map((author, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-semibold text-sm">{author.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{author}</p>
                    <p className="text-xs text-gray-500">{Math.floor(Math.random() * 10) + 1} posts</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Search with Tags */}
          <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-4">
              <h3 className="text-white font-semibold">Search with Tags</h3>
            </div>
            <div className="p-4">
              <div className="flex flex-wrap gap-2">
                {['Legal Rights', 'Business', 'Family Law', 'Criminal', 'Real Estate', 'Immigration'].map((tag, index) => (
                  <button 
                    key={index}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-full hover:bg-blue-50 hover:border-blue-300 transition-colors"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Popular Posts */}
          <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-4">
              <h3 className="text-white font-semibold">Popular Posts</h3>
            </div>
            <div className="p-4 space-y-4">
              {filteredBlogs.slice(0, 3).map(blog => (
                <div key={blog.id} className="flex gap-3">
                  <img 
                    src={blog.image} 
                    alt={blog.title}
                    className="w-16 h-12 object-cover rounded"
                    onError={(e) => {
                      if (!e.target.src.includes('picsum.photos')) {
                        e.target.src = getPlaceholderImage(blog.category, blog.id);
                      }
                    }}
                  />
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">{blog.title}</h4>
                    <p className="text-xs text-gray-500">{blog.author}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      <ReportBlogModal
        isOpen={reportModal.isOpen}
        onClose={() => setReportModal({ isOpen: false, blogId: null, blogTitle: '' })}
        blogId={reportModal.blogId}
        blogTitle={reportModal.blogTitle}
      />
    </div>
  );
};

export default Blog;