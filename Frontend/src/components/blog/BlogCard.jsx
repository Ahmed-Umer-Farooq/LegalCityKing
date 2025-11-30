import React from 'react';
import { Eye, MessageCircle, Heart, Bookmark, BarChart3, Share, Trash2 } from 'lucide-react';

const BlogCard = ({ blog, onAnalytics, onDelete, formatTimeAgo }) => {
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

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200">
      <div className="aspect-video bg-gradient-to-br from-blue-50 to-indigo-100 rounded-t-xl flex items-center justify-center overflow-hidden">
        <img 
          src={getImageUrl(blog.featured_image) || getPlaceholderImage(blog.category, blog.id)} 
          alt={blog.title} 
          className="w-full h-full object-cover" 
          onError={(e) => {
            if (!e.target.src.includes('picsum.photos')) {
              e.target.src = getPlaceholderImage(blog.category, blog.id);
            }
          }}
        />
      </div>

      <div className="p-6">
        <div className="mb-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900 flex-1">{blog.title}</h3>
            <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${
              blog.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
            }`}>
              {blog.status}
            </span>
          </div>
          <p className="text-sm text-gray-600">{formatTimeAgo(blog.created_at)}</p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          {[
            { icon: Eye, count: blog.views_count, label: 'Views', color: 'blue' },
            { icon: MessageCircle, count: blog.comment_count, label: 'Comments', color: 'green' },
            { icon: Heart, count: blog.like_count, label: 'Likes', color: 'red' },
            { icon: Bookmark, count: blog.save_count, label: 'Saves', color: 'purple' }
          ].map(({ icon: Icon, count, label, color }) => (
            <div key={label} className="flex items-center gap-2 text-sm">
              <div className={`w-8 h-8 bg-${color}-100 rounded-lg flex items-center justify-center`}>
                <Icon className={`w-4 h-4 text-${color}-600`} />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{count || 0}</p>
                <p className="text-xs text-gray-500">{label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onAnalytics(blog)}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-50 text-blue-700 px-3 py-2 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
          >
            <BarChart3 className="w-4 h-4" />
            Analytics
          </button>
          <button onClick={() => window.open(`/blog/${blog.secure_id}`, '_blank')} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              navigator.clipboard.writeText(`${window.location.origin}/blog/${blog.secure_id}`);
              alert('Link copied!');
            }}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Share className="w-4 h-4" />
          </button>
          <button onClick={() => onDelete(blog.secure_id)} className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default BlogCard;