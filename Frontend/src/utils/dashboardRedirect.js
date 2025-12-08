// Utility function to get the correct dashboard path based on user role
export const getDashboardPath = (user) => {
  if (!user) return '/';
  
  if (user.role === 'admin' || user.is_admin) {
    return '/admin-dashboard';
  } else if (user.role === 'lawyer' || user.registration_id) {
    return '/lawyer-dashboard';
  } else {
    return '/user-dashboard';
  }
};

// Utility function to navigate to the correct dashboard
export const navigateToDashboard = (navigate, user) => {
  const dashboardPath = getDashboardPath(user);
  navigate(dashboardPath);
};