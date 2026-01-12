import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, ArrowLeft, Flag } from 'lucide-react';
import CommentCount from '../../components/CommentCount';
import ReportBlogModal from '../../components/modals/ReportBlogModal';


// Blog Card Component
const BlogCard = ({ secure_id, slug, image, category, title, author, authorImage, date, comment_count = 0, onReport }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [imageError, setImageError] = useState(false);
  const [authorImageError, setAuthorImageError] = useState(false);
  const [imageAttempted, setImageAttempted] = useState(false);
  
  const handleClick = () => {
    const blogUrl = `${slug}/${secure_id}`;
    console.log('🔗 BlogCard clicked:', { slug, secure_id, title });
    
    const fromUserDashboard = location.pathname === '/user/legal-blog';
    const isAuthenticated = !!localStorage.getItem('token');
    
    if (fromUserDashboard && isAuthenticated) {
      navigate(`/user/legal-blog/${blogUrl}`, { state: { from: 'user-dashboard' } });
    } else {
      navigate(`/legal-blog/${blogUrl}`);
    }
  };
  
  const getImageSrc = (featuredImage) => {
    if (imageError || !featuredImage || featuredImage.trim() === '') {
      return `https://picsum.photos/400/200?seed=legal${secure_id}`;
    }
    if (featuredImage.startsWith('http')) {
      return featuredImage;
    }
    return `http://localhost:5001${featuredImage}`;
  };
  
  const getAuthorImageSrc = (authorImg) => {
    if (authorImageError || !authorImg) {
      return null; // Will show initials fallback
    }
    return authorImg;
  };
  
  const handleImageLoad = (e) => {
    console.log('✅ Image loaded successfully:', e.target.src);
    setImageError(false);
    setImageAttempted(true);
  };
  
  const handleImageError = (e) => {
    console.error('❌ Image failed to load:', e.target.src);
    if (!imageAttempted) {
      setImageError(true);
      setImageAttempted(true);
    }
  };
  
  const handleAuthorImageError = (e) => {
    console.error('❌ Author image failed to load:', authorImage, e);
    setAuthorImageError(true);
  };
  
  return (
    <article 
      onClick={handleClick}
      className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl cursor-pointer transition-all duration-300 hover:-translate-y-2"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      aria-label={`Read article: ${title}`}
    >
      <div className="relative overflow-hidden">
        {getImageSrc(image) ? (
          <img 
            src={getImageSrc(image)} 
            alt={title || "Blog post"} 
            className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-300" 
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        ) : (
          <div className="w-full h-56 bg-gradient-to-br from-[#E7EFFD] via-[#B8D4F1] to-[#0071BC] flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-3 bg-white/20 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-white font-medium text-sm">{category || 'Legal'} Blog</span>
            </div>
          </div>
        )}
        <div className="absolute top-4 left-4">
          <span className="inline-flex px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-full text-[#0071BC] text-sm font-semibold shadow-sm">
            {category}
          </span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onReport(secure_id, title);
          }}
          className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur-sm rounded-full text-gray-400 hover:text-red-500 hover:bg-white transition-all shadow-sm"
          title="Report this blog"
        >
          <Flag className="w-4 h-4" />
        </button>
      </div>
      <div className="p-6">
        <h3 className="text-[#181A2A] text-xl font-bold leading-tight mb-3 line-clamp-2 group-hover:text-[#0071BC] transition-colors">
          {title}
        </h3>
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center gap-3">
            {getAuthorImageSrc(authorImage) ? (
              <img 
                src={getAuthorImageSrc(authorImage)} 
                alt={author} 
                className="w-10 h-10 rounded-full object-cover" 
                onLoad={() => console.log('✅ Author image loaded:', authorImage)}
                onError={handleAuthorImageError}
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#E7EFFD] to-[#0071BC] flex items-center justify-center">
                <span className="text-white text-sm font-bold">{author?.charAt(0) || 'A'}</span>
              </div>
            )}
            <div>
              <p className="text-[#181A2A] font-semibold text-sm">{author}</p>
              <p className="text-[#97989F] text-xs">{date}</p>
            </div>
          </div>
          <CommentCount count={comment_count} className="text-[#97989F]" />
        </div>
      </div>
    </article>
  );
};



// Categories Widget
const CategoriesWidget = ({ onCategoryClick, selectedCategory }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        // Real API call to your backend
        const response = await fetch('/api/blogs/categories');
        const data = await response.json();
        console.log('📊 Categories API response:', data);
        setCategories(data || []);
      } catch (error) {
        console.error('❌ Failed to fetch categories:', error);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="h-14 bg-gradient-to-b from-[#0071BC] to-[#00D2FF] flex items-center px-4">
          <h2 className="text-white text-xl font-semibold capitalize">Categories</h2>
        </div>
        <div className="p-4">
          <div className="animate-pulse space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="bg-gradient-to-r from-[#0071BC] to-[#00D2FF] px-6 py-4">
        <h2 className="text-white text-xl font-bold">Categories</h2>
      </div>
      <div className="p-6">
        {categories && categories.length > 0 ? (
          <div className="space-y-3">
            {categories.map((category, index) => (
              <button 
                key={index}
                onClick={() => onCategoryClick(category.name)}
                className={`w-full flex justify-between items-center py-3 px-4 rounded-lg transition-all ${
                  selectedCategory === category.name 
                    ? 'bg-gradient-to-r from-[#0071BC] to-[#00D2FF] text-white shadow-md' 
                    : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <span className="font-semibold capitalize">{category.name}</span>
                <span className={`px-2 py-1 rounded-full text-sm font-bold ${
                  selectedCategory === category.name ? 'bg-white/20' : 'bg-gray-100'
                }`}>
                  {category.count?.toString().padStart(2, '0') || '00'}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-8">
            <p>No categories available</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Top Authors Widget
const TopAuthorsWidget = () => {
  const navigate = useNavigate();
  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopAuthors = async () => {
      try {
        // Real API call to your backend
        const response = await fetch('/api/blogs/top-authors');
        const data = await response.json();
        console.log('📊 Top authors API response:', data);
        setAuthors(data || []);
      } catch (error) {
        console.error('❌ Failed to fetch top authors:', error);
        setAuthors([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTopAuthors();
  }, []);

  const handleAuthorClick = (authorName) => {
    // Navigate to author's profile or filter blogs by author
    navigate(`/legal-blog?author=${encodeURIComponent(authorName)}`);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="h-14 bg-gradient-to-b from-[#0071BC] to-[#00D2FF] flex items-center px-4">
          <h2 className="text-white text-xl font-semibold capitalize">top authors</h2>
        </div>
        <div className="p-6">
          <div className="animate-pulse space-y-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex gap-6">
                <div className="w-[73px] h-[73px] bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="bg-gradient-to-r from-[#0071BC] to-[#00D2FF] px-6 py-4">
        <h2 className="text-white text-xl font-bold">Top Authors</h2>
      </div>
      <div className="p-6">
        <div className="space-y-6">
          {authors.map((author) => (
            <div 
              key={author.name} 
              onClick={() => handleAuthorClick(author.name)}
              className="flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer group"
            >
              {author.profile_image ? (
                <img 
                  src={author.profile_image} 
                  alt={author.name} 
                  className="w-14 h-14 rounded-full object-cover flex-shrink-0 ring-2 ring-gray-100"
                  onError={(e) => {
                    console.error('❌ Top author image failed:', author.profile_image);
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#E7EFFD] to-[#0071BC] flex items-center justify-center flex-shrink-0 ring-2 ring-gray-100" style={{display: author.profile_image ? 'none' : 'flex'}}>
                <span className="text-white text-lg font-bold">{author.name?.charAt(0) || 'A'}</span>
              </div>
              <div className="flex-1">
                <h3 className="text-[#181A2A] font-bold text-lg capitalize mb-1 group-hover:text-[#0071BC] transition-colors">{author.name}</h3>
                <p className="text-[#666] text-sm mb-3">
                  {author.bio || `${author.post_count} articles published`}
                </p>
                <div className="flex items-center gap-3">
                  <span className="bg-gradient-to-r from-[#0071BC] to-[#00D2FF] text-white px-3 py-1 rounded-full text-sm font-semibold">
                    {author.post_count} Posts
                  </span>
                  <div className="flex gap-1">
                    {[...Array(Math.min(author.post_count, 5))].map((_, i) => (
                      <div key={i} className="w-2 h-2 rounded-full bg-gradient-to-r from-[#0071BC] to-[#00D2FF]"></div>
                    ))}
                    {[...Array(Math.max(0, 5 - author.post_count))].map((_, i) => (
                      <div key={i} className="w-2 h-2 rounded-full bg-gray-200"></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Tags Widget
const TagsWidget = ({ onTagClick, selectedTag }) => {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTags = async () => {
      try {
        // Real API call to your backend
        const response = await fetch('/api/blogs/tags');
        const data = await response.json();
        console.log('📊 Tags API response:', data);
        setTags(data || []);
      } catch (error) {
        console.error('❌ Failed to fetch tags:', error);
        setTags([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTags();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="h-14 bg-gradient-to-b from-[#0071BC] to-[#00D2FF] flex items-center px-4">
          <h2 className="text-white text-xl font-semibold capitalize">Search with tags</h2>
        </div>
        <div className="p-6">
          <div className="animate-pulse flex flex-wrap gap-3">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="h-8 w-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="bg-gradient-to-r from-[#0071BC] to-[#00D2FF] px-6 py-4">
        <h2 className="text-white text-xl font-bold">Search Tags</h2>
      </div>
      <div className="p-6">
        <div className="flex flex-wrap gap-3">
          {tags.map((tag, index) => (
            <button
              key={index}
              onClick={() => onTagClick(tag.name)}
              className={`px-4 py-2 rounded-full text-sm font-semibold capitalize transition-all ${
                selectedTag === tag.name
                  ? 'bg-gradient-to-r from-[#0071BC] to-[#00D2FF] text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tag.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// Popular Posts Widget
const PopularPostsWidget = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPopularPosts = async () => {
      try {
        // Real API call to your backend
        const response = await fetch('/api/blogs/popular');
        const data = await response.json();
        console.log('📊 Popular posts API response:', data);
        setPosts(data || []);
      } catch (error) {
        console.error('❌ Failed to fetch popular posts:', error);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPopularPosts();
  }, []);

  const handlePostClick = (post) => {
    const blogUrl = `${post.slug}/${post.secure_id}`;
    const fromUserDashboard = location.pathname === '/user/legal-blog';
    const isAuthenticated = !!localStorage.getItem('token');
    
    if (fromUserDashboard && isAuthenticated) {
      navigate(`/user/legal-blog/${blogUrl}`, { state: { from: 'user-dashboard' } });
    } else {
      navigate(`/legal-blog/${blogUrl}`);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="h-14 bg-gradient-to-b from-[#0071BC] to-[#00D2FF] flex items-center px-4">
          <h2 className="text-white text-xl font-semibold capitalize">Popular posted</h2>
        </div>
        <div className="p-6">
          <div className="animate-pulse space-y-6">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex gap-4">
                <div className="w-28 h-[100px] bg-gray-200 rounded"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="bg-gradient-to-r from-[#0071BC] to-[#00D2FF] px-6 py-4">
        <h2 className="text-white text-xl font-bold">Popular Posts</h2>
      </div>
      <div className="p-6">
        <div className="space-y-6">
          {posts.map((post) => (
            <div 
              key={post.secure_id} 
              onClick={() => handlePostClick(post)}
              className="group cursor-pointer hover:bg-gray-50 p-4 rounded-xl transition-all"
            >
              <div className="flex gap-4">
                <img 
                  src={post.featured_image && post.featured_image.trim() !== '' 
                    ? (post.featured_image.startsWith('http') ? post.featured_image : `http://localhost:5001${post.featured_image}`)
                    : `https://picsum.photos/80/64?seed=legal${post.secure_id}`
                  } 
                  alt={post.title || "Popular post"} 
                  className="w-20 h-16 rounded-lg object-cover flex-shrink-0 group-hover:scale-105 transition-transform"
                  onError={(e) => {
                    e.target.src = `https://picsum.photos/80/64?seed=legal${post.secure_id}`;
                  }}
                />
                <div className="flex-1">
                  <span className="inline-block px-2 py-1 bg-blue-50 text-[#0071BC] text-xs font-semibold rounded-full mb-2 capitalize">
                    {post.category}
                  </span>
                  <h4 className="text-[#181A2A] font-bold text-sm leading-tight mb-3 line-clamp-2 group-hover:text-[#0071BC] transition-colors">
                    {post.title}
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="capitalize font-medium">{post.author_name}</span>
                    <span>•</span>
                    <span>{post.views_count} views</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};



// Main Blog Component
const Blog = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [selectedAuthor, setSelectedAuthor] = useState('');
  const [blogPosts, setBlogPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [reportModal, setReportModal] = useState({ isOpen: false, blogId: null, blogTitle: '' });
  
  const POSTS_PER_PAGE = 10;
  
  // Check if coming from user dashboard or admin dashboard
  const fromUserDashboard = location.pathname === '/user/legal-blog';
  const fromAdminDashboard = location.pathname === '/admin-blogs';
  
  // Check if user is logged in
  const isLoggedIn = !!localStorage.getItem('token');
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  
  // Handle URL parameters for author filtering
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const authorParam = urlParams.get('author');
    if (authorParam) {
      setSelectedAuthor(decodeURIComponent(authorParam));
    }
  }, [location.search]);

  // SEO Meta Tags
  useEffect(() => {
    document.title = 'Legal Blog - Expert Legal Insights & News | LegalCity';
    
    const updateMetaTag = (name, content) => {
      let meta = document.querySelector(`meta[name="${name}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', name);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    const updateOGTag = (property, content) => {
      let meta = document.querySelector(`meta[property="${property}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('property', property);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    updateMetaTag('description', 'Stay informed with expert legal insights, news, and analysis from qualified attorneys. Read the latest legal blog posts covering various practice areas and legal developments.');
    updateMetaTag('keywords', 'legal blog, legal news, attorney insights, law articles, legal advice, legal updates, lawyer blog, legal analysis');
    updateOGTag('og:title', 'Legal Blog - Expert Legal Insights & News | LegalCity');
    updateOGTag('og:description', 'Stay informed with expert legal insights, news, and analysis from qualified attorneys.');
    updateOGTag('og:type', 'website');
    updateOGTag('og:url', 'https://legalcity.com/legal-blog');

    return () => {
      document.title = 'LegalCity';
    };
  }, []);

  // Fetch blogs from your backend
  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        setLoading(true);
        console.log('🔄 Fetching blogs from:', 'http://localhost:5001/api/blogs');
        
        // Use relative URL due to proxy configuration
        const response = await fetch('/api/blogs', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        console.log('📡 Response status:', response.status, response.statusText);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ API Error Response:', errorText);
          throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }
        
        const data = await response.json();
        console.log('📊 Backend blogs response:', data);
        console.log('📊 Response type:', typeof data, 'Is array:', Array.isArray(data));
        
        // Backend now returns array directly
        if (!Array.isArray(data)) {
          console.error('Expected array but got:', typeof data, data);
          throw new Error('Invalid data format from server');
        }
        
        // Transform your database data to match frontend format
        const transformedBlogs = data.map(blog => ({
          secure_id: blog.secure_id,
          slug: blog.slug,
          title: blog.title,
          excerpt: blog.excerpt,
          image: blog.featured_image,
          category: blog.category || 'General',
          author: blog.author_name || 'Unknown Author',
          authorImage: blog.author_image,
          date: new Date(blog.published_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long', 
            day: 'numeric'
          }),
          tags: blog.tags ? JSON.parse(blog.tags) : [],
          views: blog.views_count,
          comment_count: parseInt(blog.comment_count) || 0
        }));
        
        console.log('✅ Transformed blogs:', transformedBlogs);
        setBlogPosts(transformedBlogs);
        setError(null); // Clear any previous errors
      } catch (err) {
        console.error('❌ Error fetching blogs:', err);
        console.error('❌ Error details:', err.message, err.stack);
        setError(`Failed to load blogs: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchBlogs();
  }, []);

  const currentBlogPosts = blogPosts;

  // Filter posts based on search term, category, and author
  useEffect(() => {
    console.log('🔍 Filtering posts with:', { searchTerm, selectedCategory, selectedAuthor, totalPosts: currentBlogPosts.length });
    let filtered = currentBlogPosts;
    
    if (searchTerm) {
      filtered = filtered.filter(post => 
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
      console.log('🔍 After search filter:', filtered.length, 'posts');
    }
    
    if (selectedCategory) {
      filtered = filtered.filter(post => 
        post.category.toLowerCase() === selectedCategory.toLowerCase()
      );
      console.log('📁 After category filter:', filtered.length, 'posts');
    }
    
    if (selectedAuthor) {
      filtered = filtered.filter(post => 
        post.author.toLowerCase() === selectedAuthor.toLowerCase()
      );
      console.log('👤 After author filter:', filtered.length, 'posts');
    }
    
    console.log('✅ Final filtered posts:', filtered.length);
    setFilteredPosts(filtered);
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, selectedAuthor, currentBlogPosts]);

  const handleSearch = () => {
    console.log('🔍 Search button clicked, current term:', searchTerm);
    // Search is handled by useEffect
  };

  const handleCategoryClick = (category) => {
    console.log('📁 Category clicked:', category, 'Previous:', selectedCategory);
    const newCategory = category === selectedCategory ? '' : category;
    console.log('📁 Setting category to:', newCategory);
    setSelectedCategory(newCategory);
  };

  const handleTagClick = (tag) => {
    console.log('🏷️ Tag clicked:', tag, 'Previous:', selectedTag);
    const newTag = tag === selectedTag ? '' : tag;
    const newSearchTerm = tag === selectedTag ? '' : tag;
    console.log('🏷️ Setting tag to:', newTag, 'Search term to:', newSearchTerm);
    setSelectedTag(newTag);
    setSearchTerm(newSearchTerm);
  };

  const allPosts = filteredPosts.length > 0 ? filteredPosts : currentBlogPosts;
  const totalPages = Math.ceil(allPosts.length / POSTS_PER_PAGE);
  const startIndex = (currentPage - 1) * POSTS_PER_PAGE;
  const displayPosts = allPosts.slice(startIndex, startIndex + POSTS_PER_PAGE);

  const handleReport = (blogId, blogTitle) => {
    setReportModal({ isOpen: true, blogId, blogTitle });
  };


  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#E7EFFD]">
        <div className="w-full bg-[#E7EFFD] px-4 sm:px-6 md:px-12 lg:px-[244px] pt-8 pb-8">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-6 sm:gap-6 max-w-2xl">
            <div className="relative flex-1">
              <div className="w-full h-[38px] bg-gray-200 animate-pulse rounded-md"></div>
            </div>
            <div className="h-[38px] w-32 bg-gray-200 animate-pulse rounded-md"></div>
          </div>
        </div>
        <section className="w-full px-4 md:px-8 lg:px-28 py-16 md:py-24">
          <div className="max-w-[1216px] mx-auto">
            <div className="flex flex-col lg:flex-row gap-8">
              <div className="flex-1">
                <div className="h-8 w-48 bg-gray-200 animate-pulse rounded mb-8"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
                      <div className="w-full h-60 bg-gray-200 rounded-md mb-4"></div>
                      <div className="space-y-3">
                        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                        <div className="h-6 bg-gray-200 rounded w-full"></div>
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-[#E7EFFD] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Failed to Load Blogs</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >Try Again</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${fromUserDashboard ? 'bg-[#F1F9FF]' : 'bg-[#E7EFFD]'}`}>

      
      {fromAdminDashboard && (
        <div className="w-full bg-white border-b border-gray-200 px-4 sm:px-6 md:px-12 lg:px-[244px] py-4">
          <button
            onClick={() => navigate('/admin-dashboard')}
            className="flex items-center gap-2 text-red-600 hover:text-red-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Admin Dashboard</span>
          </button>
        </div>
      )}
      
      {/* Blog Search Section */}
      <div className="w-full bg-lawyer-gray px-4 sm:px-6 md:px-12 lg:px-[244px] pt-12 md:pt-16 lg:pt-20 pb-8 md:pb-12 lg:pb-[92px] relative overflow-hidden">
        {/* SEO-friendly background image */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1920&h=1080&fit=crop&crop=center&auto=format&q=80" 
            alt="Professional lawyers and legal experts in modern law office discussing legal insights and blog content - Legal consultation and analysis background"
            className="w-full h-full object-cover opacity-15"
            loading="eager"
            fetchpriority="high"
          />
        </div>
        <div className="relative z-10 flex flex-col gap-8">
          <div className="text-center">
            <h1 className="text-lawyer-blue font-inter text-3xl sm:text-4xl lg:text-[45px] font-bold leading-tight lg:leading-[52px] mb-4">
              Legal Blog
            </h1>
          </div>

          <div className="max-w-2xl mx-auto w-full">
            <div className="flex flex-col sm:flex-row items-stretch gap-4 bg-white rounded-lg shadow-lg p-2">
              <div className="relative flex-1">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <Search className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search legal articles, topics, or authors..."
                  value={searchTerm}
                  onChange={(e) => {
                    console.log('✏️ Search input changed:', e.target.value);
                    setSearchTerm(e.target.value);
                  }}
                  aria-label="Search legal blog posts"
                  className="w-full h-12 pl-12 pr-4 py-3 border-0 bg-transparent text-base font-inter placeholder:text-gray-500 focus:outline-none focus:ring-0"
                />
              </div>

              <button 
                onClick={() => {
                  console.log('🔍 Search button clicked');
                  handleSearch();
                }}
                className="h-12 px-8 bg-gradient-to-r from-[#0071BC] to-[#00D2FF] text-white font-inter text-sm font-semibold hover:opacity-90 transition-all duration-200 rounded-md shadow-md hover:shadow-lg whitespace-nowrap"
              >
                Search
              </button>
            </div>
          </div>
        </div>
      </div>

      <section className="w-full min-h-screen">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-16 min-h-screen">
          <div className="flex flex-col lg:flex-row gap-12 min-h-screen">
            {/* Blog Posts */}
            <div className="flex-1 max-w-4xl min-h-screen">
              <div className="mb-12">
                <h2 className="text-[#181A2A] text-3xl font-bold mb-4">
                  {selectedAuthor ? `Blogs by ${selectedAuthor}` : 'Latest Blogs'}
                </h2>
                <p className="text-gray-600 text-lg mb-6">
                  {selectedAuthor ? `All articles written by ${selectedAuthor}` : 'Stay updated with expert legal insights and analysis'}
                </p>
                {selectedAuthor && (
                  <button
                    onClick={() => {
                      setSelectedAuthor('');
                      navigate('/legal-blog');
                    }}
                    className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Show All Blogs
                  </button>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
                {displayPosts.map((post, index) => (
                  <BlogCard key={post.secure_id || index} {...post} onReport={handleReport} />
                ))}
              </div>
              
              {displayPosts.length === 0 && searchTerm && (
                <div className="text-center py-16 bg-white rounded-xl shadow-sm">
                  <div className="text-gray-400 mb-6">
                    <Search className="w-16 h-16 mx-auto" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">No articles found</h3>
                  <p className="text-gray-600 text-lg">No blogs found matching "{searchTerm}"</p>
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-3 mt-12 pt-8 border-t border-gray-200">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`px-4 py-2 rounded-lg ${
                        currentPage === i + 1
                          ? 'bg-gradient-to-r from-[#0071BC] to-[#00D2FF] text-white'
                          : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>

            {/* Right Sidebar */}
            <aside className="hidden lg:block w-full lg:w-80 flex-shrink-0">
              <div className="sticky top-8 space-y-10">
                <CategoriesWidget 
                  onCategoryClick={handleCategoryClick} 
                  selectedCategory={selectedCategory} 
                />
                <TopAuthorsWidget />
                <TagsWidget 
                  onTagClick={handleTagClick} 
                  selectedTag={selectedTag} 
                />
                <PopularPostsWidget />
              </div>
            </aside>
          </div>
        </div>
      </section>

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