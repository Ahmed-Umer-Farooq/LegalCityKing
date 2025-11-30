import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Phone, Mail, Calendar, Award, BookOpen } from 'lucide-react';

const AuthorProfile = () => {
  const { authorName } = useParams();
  const navigate = useNavigate();
  const [author, setAuthor] = useState(null);
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAuthorProfile = async () => {
      try {
        setLoading(true);
        
        // Fetch blogs by author
        const blogsResponse = await fetch(`/api/blogs`);
        const blogsData = await blogsResponse.json();
        const authorBlogs = blogsData.filter(blog => blog.author_name === authorName);
        
        // Create author profile from blog data
        const authorProfile = {
          name: authorName,
          title: 'Senior Legal Expert',
          bio: 'Professional writer and legal expert with extensive experience in various areas of law.',
          location: 'Legal City',
          email: 'contact@legalcity.com',
          phone: '+1 (555) 123-4567',
          experience: '10+ years',
          specializations: [...new Set(authorBlogs.map(blog => blog.category))],
          totalBlogs: authorBlogs.length,
          totalViews: authorBlogs.reduce((sum, blog) => sum + (blog.views_count || 0), 0)
        };
        
        setAuthor(authorProfile);
        setBlogs(authorBlogs);
      } catch (error) {
        console.error('Error fetching author profile:', error);
      } finally {
        setLoading(false);
      }
    };

    if (authorName) {
      fetchAuthorProfile();
    }
  }, [authorName]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!author) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Profile Not Found</h1>
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 mx-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft size={20} />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back</span>
          </button>
        </div>
      </div>

      {/* Profile Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="relative bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 px-8 py-12 overflow-hidden">
            {/* Professional background pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
              }}></div>
            </div>
            <div className="relative flex items-start gap-6">
              <div className="w-24 h-24 rounded-full bg-white/10 backdrop-blur-sm border-2 border-white/20 flex items-center justify-center shadow-xl">
                <span className="text-white text-3xl font-bold">{author.name?.charAt(0) || 'L'}</span>
              </div>
              <div className="flex-1 text-white">
                <h1 className="text-3xl font-bold mb-2">{author.name}</h1>
                <p className="text-xl text-blue-100 mb-4">{author.title}</p>
                <div className="flex flex-wrap gap-6 text-blue-100">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>{author.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4" />
                    <span>{author.experience}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    <span>{author.totalBlogs} Articles</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* About */}
              <div className="lg:col-span-2">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">About</h2>
                <p className="text-gray-600 leading-relaxed mb-6">{author.bio}</p>
                
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Specializations</h3>
                <div className="flex flex-wrap gap-2 mb-6">
                  {author.specializations.map((spec, index) => (
                    <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                      {spec}
                    </span>
                  ))}
                </div>
              </div>

              {/* Contact Info */}
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Contact Information</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-gray-600">
                    <Mail className="w-5 h-5" />
                    <span>{author.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-600">
                    <Phone className="w-5 h-5" />
                    <span>{author.phone}</span>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">Statistics</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Articles:</span>
                      <span className="font-medium">{author.totalBlogs}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Views:</span>
                      <span className="font-medium">{author.totalViews.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Articles Section */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Articles by {author.name}</h2>
          {blogs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {blogs.map((blog) => (
                <div 
                  key={blog.id}
                  onClick={() => {
                    const slug = blog.slug || blog.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                    navigate(`/legal-blog/${slug}/${blog.secure_id}`);
                  }}
                  className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                >
                  <img 
                    src={blog.featured_image || `https://picsum.photos/400/200?seed=legal${blog.id}`}
                    alt={blog.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-6">
                    <div className="mb-3">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {blog.category}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                      {blog.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {blog.excerpt}
                    </p>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>{new Date(blog.published_at).toLocaleDateString()}</span>
                      <span>{blog.views_count || 0} views</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No articles published yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthorProfile;