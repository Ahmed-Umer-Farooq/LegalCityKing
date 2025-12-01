import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Clock, Calendar, Share2, Heart, Bookmark, Twitter, Facebook, Linkedin, Flag } from 'lucide-react';
import CommentSection from '../../components/CommentSection';
import ReportBlogModal from '../../components/modals/ReportBlogModal';
import { useAuth } from '../../context/AuthContext';
import { updatePageMeta, generateSlug } from '../../utils/seo';

const BlogDetail = () => {
  const { id } = useParams();
  console.log('🔍 Blog ID from params:', id);
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const fromUserDashboard = location.state?.from === 'user-dashboard';
  const fromAdminDashboard = location.pathname.startsWith('/admin/');
  
  // Image handling functions
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
  
  // Determine view context
  const isDashboardView = isAuthenticated && location.pathname.startsWith('/user/');
  const isAdminView = fromAdminDashboard || location.state?.from === 'admin-dashboard';
  const isPublicView = !isDashboardView && !isAdminView;
  const [blogPost, setBlogPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [relatedArticles, setRelatedArticles] = useState([]);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [reportModal, setReportModal] = useState({ isOpen: false, blogId: null, blogTitle: '' });
  const [blogId, setBlogId] = useState(null); // Store the actual blog ID for API calls



  // Check localStorage for like/save status on component mount
  useEffect(() => {
    if (!isAuthenticated) {
      const likedBlogs = JSON.parse(localStorage.getItem('likedBlogs') || '[]');
      const savedBlogs = JSON.parse(localStorage.getItem('savedBlogs') || '[]');
      setLiked(likedBlogs.includes(id));
      setSaved(savedBlogs.includes(id));
    }
  }, [id, isAuthenticated]);

  useEffect(() => {
    const fetchBlogPost = async () => {
      try {
        setLoading(true);
        console.log('🔍 Fetching blog post with ID:', id);
        
        if (!id) {
          throw new Error('Blog ID is missing from URL parameters');
        }
        
        // Extract secure_id from URL (format: slug/secure_id)
        const identifier = id.includes('/') ? id.split('/').pop() : id;
        console.log('🔑 Using identifier:', identifier);
        
        const response = await fetch(`/api/blogs/${identifier}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('📊 Blog detail response:', data);
        
        // Store the actual blog ID for API calls
        setBlogId(data.id);
        
        // Fetch like/save status for authenticated users
        if (isAuthenticated && data.id) {
          fetchLikeSaveStatus(data.id);
        }
        
        // Transform backend data to match frontend format
        const transformedPost = {
          id: data.id,
          title: data.title,
          subtitle: data.excerpt || 'Read more about this topic',
          image: getImageUrl(data.featured_image) || getPlaceholderImage(data.category || 'General', data.id),
          category: data.category || 'General',
          author: data.author_name || 'Unknown Author',
          authorImage: data.author_image,
          authorBio: data.author_bio || 'Professional writer and legal expert',
          date: new Date(data.published_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }),
          readTime: '5 min read',
          content: data.content || '<p>Content coming soon...</p>'
        };
        
        console.log('✅ Transformed blog post:', transformedPost);
        setBlogPost(transformedPost);
        
        // Update SEO meta tags
        const slug = generateSlug(transformedPost.title);
        updatePageMeta(
          `${transformedPost.title} | LegalCity Blog`,
          transformedPost.subtitle || `Read about ${transformedPost.category} law and legal insights.`,
          `${transformedPost.category}, legal advice, law, lawyer, ${transformedPost.author}`,
          `${window.location.origin}/legal-blog/${id}/${slug}`
        );
        
      } catch (err) {
        console.error('❌ Error fetching blog post:', err);
        setError('Failed to load blog post');
      } finally {
        setLoading(false);
      }
    };

    fetchBlogPost();
  }, [id]);

  // Fetch current like/save status for authenticated users
  const fetchLikeSaveStatus = async (blogId) => {
    try {
      const token = localStorage.getItem('token');
      const [likeRes, saveRes] = await Promise.all([
        fetch(`/api/blogs/${blogId}/like-status`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`/api/blogs/${blogId}/save-status`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);
      
      if (likeRes.ok) {
        const likeData = await likeRes.json();
        setLiked(likeData.liked);
      }
      
      if (saveRes.ok) {
        const saveData = await saveRes.json();
        setSaved(saveData.saved);
      }
    } catch (error) {
      console.log('Could not fetch like/save status:', error);
    }
  };

  // Fetch related articles from database
  useEffect(() => {
    const fetchRelatedArticles = async () => {
      try {
        console.log('🔗 Fetching related articles...');
        const response = await fetch('/api/blogs?limit=6');
        const articles = await response.json();
        
        // Filter out current article and take first 3
        const related = articles
          .filter(article => article.secure_id !== id)
          .slice(0, 3)
          .map(article => ({
            id: article.secure_id,
            title: article.title,
            image: getImageUrl(article.featured_image) || getPlaceholderImage(article.category || 'General', article.secure_id),
            category: article.category || 'General',
            readTime: '5 min read'
          }));
        
        console.log('✅ Related articles:', related);
        setRelatedArticles(related);
      } catch (error) {
        console.error('❌ Error fetching related articles:', error);
      }
    };

    if (id) {
      fetchRelatedArticles();
    }
  }, [id]);

  const handleLike = async () => {
    // Allow non-logged users to like (store in localStorage)
    if (!isAuthenticated) {
      const likedBlogs = JSON.parse(localStorage.getItem('likedBlogs') || '[]');
      const isCurrentlyLiked = likedBlogs.includes(id);
      
      if (isCurrentlyLiked) {
        const updated = likedBlogs.filter(blogId => blogId !== id);
        localStorage.setItem('likedBlogs', JSON.stringify(updated));
        setLiked(false);
      } else {
        likedBlogs.push(id);
        localStorage.setItem('likedBlogs', JSON.stringify(likedBlogs));
        setLiked(true);
        // Show notification for first-time users
        if (likedBlogs.length === 1) {
          alert('Like saved locally! Sign up to sync your preferences across devices.');
        }
      }
      return;
    }
    
    // Check if we have the blog ID
    if (!blogId) {
      console.error('Blog ID not available for like operation');
      alert('Unable to like this post. Please try refreshing the page.');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/blogs/${blogId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setLiked(data.liked);
        console.log('Like toggled successfully:', data.message);
      } else {
        const errorData = await response.json();
        console.error('Like operation failed:', errorData.message);
        alert('Failed to like this post. Please try again.');
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      alert('Network error. Please check your connection and try again.');
    }
  };

  const handleSave = async () => {
    // Allow non-logged users to save (store in localStorage)
    if (!isAuthenticated) {
      const savedBlogs = JSON.parse(localStorage.getItem('savedBlogs') || '[]');
      const isCurrentlySaved = savedBlogs.includes(id);
      
      if (isCurrentlySaved) {
        const updated = savedBlogs.filter(blogId => blogId !== id);
        localStorage.setItem('savedBlogs', JSON.stringify(updated));
        setSaved(false);
      } else {
        savedBlogs.push(id);
        localStorage.setItem('savedBlogs', JSON.stringify(savedBlogs));
        setSaved(true);
        // Show notification for first-time users
        if (savedBlogs.length === 1) {
          alert('Article saved locally! Sign up to access your saved articles from any device.');
        }
      }
      return;
    }
    
    // Check if we have the blog ID
    if (!blogId) {
      console.error('Blog ID not available for save operation');
      alert('Unable to save this post. Please try refreshing the page.');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/blogs/${blogId}/save`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSaved(data.saved);
        console.log('Save toggled successfully:', data.message);
      } else {
        const errorData = await response.json();
        console.error('Save operation failed:', errorData.message);
        alert('Failed to save this post. Please try again.');
      }
    } catch (error) {
      console.error('Error toggling save:', error);
      alert('Network error. Please check your connection and try again.');
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    const title = blogPost?.title || 'Check out this blog post';
    
    if (navigator.share) {
      navigator.share({
        title: title,
        url: url
      });
    } else {
      navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading blog post...</p>
        </div>
      </div>
    );
  }

  if (error || !blogPost) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Blog Post Not Found</h1>
          <p className="text-gray-600 mb-6">{error || 'The requested blog post could not be found.'}</p>
          <button 
            onClick={() => navigate('/blogs')}
            className="flex items-center gap-2 mx-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft size={20} />
            Back to Blogs
          </button>
        </div>
      </div>
    );
  }

  const currentBlogPost = {
    ...blogPost
  };

  return (
    <div className="min-h-screen bg-gray-50">


      {/* Hero Section */}
      <div className="bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Category Badge */}
          <div className="mb-6">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
              {currentBlogPost.category}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-4">
            {currentBlogPost.title}
          </h1>

          {/* Subtitle */}
          <p className="text-xl text-gray-600 leading-relaxed mb-8">
            {currentBlogPost.subtitle}
          </p>

          {/* Meta Information */}
          <div className="flex flex-wrap items-center justify-between mb-8">
            <div 
              className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
              onClick={() => {
                // Navigate to author profile
                navigate(`/author/${encodeURIComponent(currentBlogPost.author)}`);
              }}
            >
              {currentBlogPost.authorImage ? (
                <img 
                  src={currentBlogPost.authorImage} 
                  alt={currentBlogPost.author}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#E7EFFD] to-[#0071BC] flex items-center justify-center">
                  <span className="text-white font-bold">{currentBlogPost.author?.charAt(0) || 'A'}</span>
                </div>
              )}
              <div>
                <p className="font-semibold text-gray-900">{currentBlogPost.author}</p>
                <p className="text-sm text-gray-600">Senior Technology Writer</p>
                <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                  <div className="flex items-center gap-1">
                    <Calendar size={14} />
                    {currentBlogPost.date}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock size={14} />
                    {currentBlogPost.readTime}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button 
                onClick={handleLike}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  liked 
                    ? 'bg-red-100 text-red-600' 
                    : 'bg-red-50 text-red-600 hover:bg-red-100'
                }`}
                title={!isAuthenticated ? 'Like (stored locally)' : 'Like'}
              >
                <Heart size={18} fill={liked ? 'currentColor' : 'none'} />
                <span className="font-medium">{liked ? 'Liked' : 'Like'}</span>
                {!isAuthenticated && <span className="text-xs opacity-75">(local)</span>}
              </button>
              <button 
                onClick={handleSave}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  saved 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                title={!isAuthenticated ? 'Save (stored locally)' : 'Save'}
              >
                <Bookmark size={18} fill={saved ? 'currentColor' : 'none'} />
                <span className="font-medium">{saved ? 'Saved' : 'Save'}</span>
                {!isAuthenticated && <span className="text-xs opacity-75">(local)</span>}
              </button>
              <button 
                onClick={handleShare}
                className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <Share2 size={18} />
                <span className="font-medium">Share</span>
              </button>
              <button
                onClick={() => setReportModal({ isOpen: true, blogId: blogId, blogTitle: currentBlogPost.title })}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                title="Report this blog"
              >
                <Flag size={18} />
                <span className="font-medium">Report</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Image */}
      <div className="bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <img 
            src={currentBlogPost.image} 
            alt={currentBlogPost.title}
            className="w-full h-96 object-cover rounded-xl shadow-lg"
            onError={(e) => {
              if (!e.target.src.includes('picsum.photos')) {
                e.target.src = getPlaceholderImage(currentBlogPost.category, currentBlogPost.id);
              }
            }}
          />
        </div>
      </div>

      {/* Article Content */}
      <div className="bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="prose prose-lg max-w-none">
            <div 
              dangerouslySetInnerHTML={{ __html: currentBlogPost.content }}
              className="text-gray-800 leading-relaxed space-y-6"
              style={{
                fontSize: '18px',
                lineHeight: '1.8'
              }}
            />
          </div>
        </div>
      </div>





      {/* Comments Section */}
      <div className="bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <CommentSection blogId={blogId} isDashboardView={isDashboardView} isPublicView={isPublicView} />
        </div>
      </div>

      {/* Related Articles */}
      <div className="bg-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Related Articles</h2>
          {relatedArticles.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-600">Loading related articles...</p>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedArticles.map((article) => (
              <div 
                key={article.id}
                onClick={() => {
                  console.log('🔗 Related article clicked:', article.title);
                  const slug = generateSlug(article.title);
                  navigate(`/legal-blog/${slug}/${article.id}`);
                }}
                className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
              >
                <img 
                  src={article.image} 
                  alt={article.title}
                  className="w-full h-48 object-cover"
                  onError={(e) => {
                    if (!e.target.src.includes('picsum.photos')) {
                      e.target.src = getPlaceholderImage(article.category, article.id);
                    }
                  }}
                />
                <div className="p-6">
                  <div className="mb-3">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {article.category}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                    {article.title}
                  </h3>
                  <p className="text-sm text-gray-600">{article.readTime}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Newsletter Signup */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-400">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Stay Updated</h2>
            <p className="text-xl text-blue-100 mb-8">Get the latest insights delivered to your inbox</p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input 
                type="email" 
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-white/50"
              />
              <button className="px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors">
                Subscribe
              </button>
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

export default BlogDetail;