/**
 * Get the full avatar URL
 * Handles relative paths from backend and external URLs
 * @param {string} avatar - Avatar path from user object
 * @returns {string} Full avatar URL
 */
export const getAvatarUrl = (avatar) => {
  if (!avatar) return 'https://via.placeholder.com/150';
  if (avatar.startsWith('http')) return avatar;
  // If it's a relative path, prepend the backend URL
  const backendUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
  return `${backendUrl}${avatar}`;
};
