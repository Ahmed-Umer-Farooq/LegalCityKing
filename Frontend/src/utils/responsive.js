// Responsive utility functions for enterprise-level responsive design

// Standard breakpoints
export const breakpoints = {
  xs: '320px',   // Mobile small
  sm: '640px',   // Mobile
  md: '768px',   // Tablet
  lg: '1024px',  // Desktop
  xl: '1280px',  // Large desktop
  '2xl': '1536px' // Extra large
};

// Common responsive classes
export const responsive = {
  // Container classes
  container: 'w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
  containerSm: 'w-full max-w-4xl mx-auto px-4 sm:px-6',
  
  // Grid systems
  grid: {
    cols1: 'grid grid-cols-1',
    cols2: 'grid grid-cols-1 md:grid-cols-2',
    cols3: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    cols4: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    cols6: 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6'
  },
  
  // Flex utilities
  flex: {
    center: 'flex items-center justify-center',
    between: 'flex items-center justify-between',
    col: 'flex flex-col',
    colCenter: 'flex flex-col items-center justify-center',
    wrap: 'flex flex-wrap',
    responsive: 'flex flex-col md:flex-row'
  },
  
  // Text sizes
  text: {
    xs: 'text-xs sm:text-sm',
    sm: 'text-sm sm:text-base',
    base: 'text-base sm:text-lg',
    lg: 'text-lg sm:text-xl',
    xl: 'text-xl sm:text-2xl',
    '2xl': 'text-2xl sm:text-3xl',
    '3xl': 'text-3xl sm:text-4xl lg:text-5xl'
  },
  
  // Spacing
  spacing: {
    section: 'py-8 sm:py-12 lg:py-16',
    card: 'p-4 sm:p-6 lg:p-8',
    gap: 'gap-4 sm:gap-6 lg:gap-8'
  },
  
  // Common patterns
  card: 'bg-white rounded-lg shadow-sm border p-4 sm:p-6',
  button: 'px-4 py-2 sm:px-6 sm:py-3 rounded-lg font-medium transition-colors',
  input: 'w-full px-3 py-2 sm:px-4 sm:py-3 border rounded-lg focus:outline-none focus:ring-2'
};

// Hook for responsive behavior
export const useResponsive = () => {
  const isMobile = window.innerWidth < 768;
  const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
  const isDesktop = window.innerWidth >= 1024;
  
  return { isMobile, isTablet, isDesktop };
};