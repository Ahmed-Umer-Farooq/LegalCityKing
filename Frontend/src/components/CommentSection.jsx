import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MessageCircle, User, Trash2, Reply } from 'lucide-react';

const CommentSection = ({ blogId, isDashboardView, isPublicView }) => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [blogId]);

  const fetchComments = async () => {
    try {
      console.log('Fetching comments for blog:', blogId);
      const response = await fetch(`/api/blogs/${blogId}/comments`);
      console.log('Comments response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('Comments data:', data);
        setComments(data);
      } else {
        const errorText = await response.text();
        console.error('Failed to fetch comments:', response.status, errorText);
        setComments([]);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
      setComments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    const token = localStorage.getItem('token');
    console.log('Token exists:', !!token);
    console.log('isAuthenticated:', isAuthenticated);
    console.log('user:', user);
    
    if (!isAuthenticated || !token) {
      alert('Please login to comment');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/blogs/${blogId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          comment_text: newComment,
          parent_comment_id: replyTo
        })
      });

      console.log('Comment post response:', response.status);
      if (response.ok) {
        setNewComment('');
        setReplyTo(null);
        await fetchComments();
      } else {
        const errorData = await response.text();
        console.error('Comment post error:', errorData);
        alert('Failed to post comment: ' + errorData);
      }
    } catch (error) {
      console.error('Error posting comment:', error);
      alert('Error posting comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    const { toast } = await import('sonner');
    toast.info('Deleting comment...', { duration: 1000 });
    
    setTimeout(async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/blogs/comments/${commentId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          setComments(comments.filter(comment => comment.id !== commentId));
          toast.success('Comment deleted successfully');
        } else {
          toast.error('Failed to delete comment');
        }
      } catch (error) {
        console.error('Error deleting comment:', error);
        toast.error('Error deleting comment');
      }
    }, 1000);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleBadge = (role) => {
    if (role === 'lawyer') {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          Lawyer
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        User
      </span>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-6">
        <MessageCircle size={24} className="text-blue-600" />
        <h3 className="text-2xl font-bold text-gray-900">
          Comments ({comments.length})
        </h3>
      </div>

      {isAuthenticated ? (
        <form onSubmit={handleSubmitComment} className="mb-8">
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-600 flex items-center justify-center flex-shrink-0">
              <User size={20} className="text-white" />
            </div>
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={replyTo ? "Write a reply..." : "Share your thoughts..."}
                className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows="3"
              />
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-2">
                  {replyTo && (
                    <button
                      type="button"
                      onClick={() => setReplyTo(null)}
                      className="text-sm text-gray-500 hover:text-gray-700"
                    >
                      Cancel Reply
                    </button>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={!newComment.trim() || submitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting ? 'Posting...' : 'Post Comment'}
                </button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
          <MessageCircle size={24} className="text-yellow-600 mx-auto mb-2" />
          <p className="text-gray-700 mb-3 font-medium">Login to comment</p>
          <p className="text-gray-600 text-sm mb-4">Access blogs from your dashboard to post comments and engage with the community</p>
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => {
                // Save current blog URL for redirect after login
                const currentPath = window.location.pathname;
                let blogPath;
                if (currentPath.includes('/legal-blog/')) {
                  blogPath = currentPath.split('/legal-blog/')[1];
                } else {
                  blogPath = currentPath.split('/').slice(-2).join('/');
                }
                sessionStorage.setItem('redirectAfterLogin', `/user/legal-blog/${blogPath}`);
                window.location.href = '/login';
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Login to Comment
            </button>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {comments.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle size={48} className="text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No comments yet. Be the first to share your thoughts!</p>
          </div>
        ) : (
          comments
            .filter(comment => !comment.parent_comment_id)
            .map(comment => (
              <div key={comment.id} className="border-b border-gray-100 pb-6 last:border-b-0">
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm font-bold">
                      {comment.user_name?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-gray-900">
                        {comment.user_name || 'Anonymous'}
                      </span>
                      {getRoleBadge(comment.user_role)}
                      <span className="text-sm text-gray-500">
                        {formatDate(comment.created_at)}
                      </span>
                    </div>
                    <p className="text-gray-800 leading-relaxed mb-3">
                      {comment.comment_text}
                    </p>
                    <div className="flex items-center gap-4">
                      {isAuthenticated && (
                        <button
                          onClick={() => setReplyTo(comment.id)}
                          className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 transition-colors"
                        >
                          <Reply size={16} />
                          Reply
                        </button>
                      )}
                      {isAuthenticated && (user?.id === comment.user_id || user?.role === 'admin') && (
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700 transition-colors"
                        >
                          <Trash2 size={16} />
                          Delete
                        </button>
                      )}
                    </div>

                    {comments
                      .filter(reply => reply.parent_comment_id === comment.id)
                      .map(reply => (
                        <div key={reply.id} className="mt-4 ml-6 pl-4 border-l-2 border-gray-200">
                          <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-100 to-gray-500 flex items-center justify-center flex-shrink-0">
                              <span className="text-white text-xs font-bold">
                                {reply.user_name?.charAt(0) || 'U'}
                              </span>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-semibold text-gray-900 text-sm">
                                  {reply.user_name || 'Anonymous'}
                                </span>
                                {getRoleBadge(reply.user_role)}
                                <span className="text-xs text-gray-500">
                                  {formatDate(reply.created_at)}
                                </span>
                              </div>
                              <p className="text-gray-800 text-sm leading-relaxed mb-2">
                                {reply.comment_text}
                              </p>
                              {isAuthenticated && (user?.id === reply.user_id || user?.role === 'admin') && (
                                <button
                                  onClick={() => handleDeleteComment(reply.id)}
                                  className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700 transition-colors"
                                >
                                  <Trash2 size={14} />
                                  Delete
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  );
};

export default CommentSection;