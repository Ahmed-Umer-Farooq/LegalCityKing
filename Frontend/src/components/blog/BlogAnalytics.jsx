import React from 'react';
import { Eye, MessageCircle, Heart, Bookmark, BarChart3, TrendingUp, Users, Calendar, Trash2 } from 'lucide-react';

const BlogAnalytics = ({ blog, analytics, onDeleteComment, formatTimeAgo }) => {
  if (!analytics) return <div>Loading analytics...</div>;

  const activities = [];
  
  analytics.comments?.forEach(comment => {
    activities.push({
      type: 'comment',
      user: comment.user_name || 'Anonymous',
      date: comment.created_at,
      content: comment.comment_text,
      icon: MessageCircle,
      color: 'green'
    });
  });
  
  analytics.likes?.forEach(like => {
    activities.push({
      type: 'like',
      user: like.name || 'Anonymous',
      date: like.created_at,
      content: 'liked your blog post',
      icon: Heart,
      color: 'red'
    });
  });
  
  analytics.saves?.forEach(save => {
    activities.push({
      type: 'save',
      user: save.name || 'Anonymous',
      date: save.created_at,
      content: 'saved your blog post',
      icon: Bookmark,
      color: 'purple'
    });
  });
  
  activities.sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">{blog.title}</h3>
            <p className="text-gray-600">Published {formatTimeAgo(blog.created_at)}</p>
          </div>
          <button
            onClick={() => {
              const slug = blog.slug || blog.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
              window.open(`/legal-blog/${slug}/${blog.secure_id}`, '_blank');
            }}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Eye className="w-4 h-4" />
            View Live
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { icon: Eye, count: analytics.metrics?.views_count, label: 'Total Views', color: 'blue', indicator: true },
          { icon: MessageCircle, count: analytics.metrics?.comment_count, label: 'Total Comments', color: 'green', extra: `${analytics.comments?.length || 0} unique users` },
          { icon: Heart, count: analytics.metrics?.like_count, label: 'Total Likes', color: 'red', extra: `${analytics.likes?.length || 0} unique users` },
          { icon: Bookmark, count: analytics.metrics?.save_count, label: 'Total Saves', color: 'purple', extra: `${analytics.saves?.length || 0} unique users` }
        ].map(({ icon: Icon, count, label, color, indicator, extra }) => (
          <div key={label} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 bg-${color}-100 rounded-xl flex items-center justify-center`}>
                <Icon className={`w-6 h-6 text-${color}-600`} />
              </div>
              {indicator && count > 0 && <div className={`w-2 h-2 bg-${color}-500 rounded-full animate-pulse`}></div>}
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{count || 0}</h3>
            <p className="text-sm text-gray-600">{label}</p>
            {extra && <div className={`mt-3 flex items-center text-xs text-${color}-600`}>
              <Users className="w-3 h-3 mr-1" />
              <span>{extra}</span>
            </div>}
          </div>
        ))}
      </div>

      {/* Engagement Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Engagement Summary</h3>
            <p className="text-sm text-gray-600">Real-time analytics for your blog post</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 border border-blue-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Engagement Rate</span>
              <TrendingUp className="w-4 h-4 text-green-500" />
            </div>
            <p className="text-xl font-bold text-gray-900">
              {analytics.metrics?.views_count > 0 
                ? Math.round(((analytics.metrics?.comment_count || 0) + (analytics.metrics?.like_count || 0)) / analytics.metrics.views_count * 100)
                : 0}%
            </p>
            <p className="text-xs text-gray-500 mt-1">Comments + Likes / Views</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-blue-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Save Rate</span>
              <Bookmark className="w-4 h-4 text-purple-500" />
            </div>
            <p className="text-xl font-bold text-gray-900">
              {analytics.metrics?.views_count > 0 
                ? Math.round((analytics.metrics?.save_count || 0) / analytics.metrics.views_count * 100)
                : 0}%
            </p>
            <p className="text-xs text-gray-500 mt-1">Saves / Views</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-blue-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Total Interactions</span>
              <Users className="w-4 h-4 text-blue-500" />
            </div>
            <p className="text-xl font-bold text-gray-900">
              {(analytics.metrics?.comment_count || 0) + (analytics.metrics?.like_count || 0) + (analytics.metrics?.save_count || 0)}
            </p>
            <p className="text-xs text-gray-500 mt-1">Comments + Likes + Saves</p>
          </div>
        </div>
      </div>

      {/* Comments Management */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Comments Management</h3>
          <p className="text-sm text-gray-600 mt-1">Moderate comments on your blog post</p>
        </div>
        <div className="p-6">
          {analytics.comments?.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">No comments yet</h4>
              <p className="text-gray-500">Comments will appear here when readers engage with your blog.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {analytics.comments.map((comment) => (
                <div key={comment.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                        {comment.user_name?.charAt(0) || 'U'}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-gray-900">{comment.user_name || 'Anonymous'}</h4>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            comment.user_role === 'lawyer' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {comment.user_role || 'User'}
                          </span>
                          <span className="text-xs text-gray-500">{formatTimeAgo(comment.created_at)}</span>
                        </div>
                        <p className="text-gray-700">{comment.comment_text}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => onDeleteComment(comment.id)}
                      className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors ml-4"
                      title="Delete Comment"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Recent Activity Timeline
          </h3>
          <p className="text-sm text-gray-600 mt-1">Latest engagement activities on your blog</p>
        </div>
        <div className="p-6">
          {activities.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No recent activity</p>
              <p className="text-sm text-gray-400 mt-1">Activity will appear here as users engage with your blog</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {activities.slice(0, 20).map((activity, index) => {
                const IconComponent = activity.icon;
                const colorClasses = {
                  green: 'bg-green-100 text-green-600',
                  red: 'bg-red-100 text-red-600',
                  purple: 'bg-purple-100 text-purple-600'
                };
                
                return (
                  <div key={index} className="flex items-start gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${colorClasses[activity.color]} flex-shrink-0`}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-gray-900">{activity.user}</p>
                        <span className="text-sm text-gray-500">{activity.content}</span>
                      </div>
                      {activity.type === 'comment' && activity.content !== 'liked your blog post' && activity.content !== 'saved your blog post' && (
                        <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded mt-2">
                          "{activity.content}"
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">{formatTimeAgo(activity.date)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BlogAnalytics;