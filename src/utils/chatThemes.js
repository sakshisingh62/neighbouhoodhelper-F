// Lightweight chat themes (gradients only)
export const chatThemes = [
  { id: 'default', name: 'Default', gradient: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)', textColor: '#111827' },
  { id: 'purple', name: 'Purple Dream', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', textColor: '#ffffff' },
  { id: 'ocean', name: 'Ocean Blue', gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', textColor: '#ffffff' },
  { id: 'sunset', name: 'Sunset', gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', textColor: '#111827' },
  { id: 'forest', name: 'Forest Green', gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', textColor: '#ffffff' },
];

export const saveThemePreference = (chatId, themeId) => {
  try {
    const preferences = JSON.parse(localStorage.getItem('chatThemes') || '{}');
    preferences[chatId] = { themeId, timestamp: Date.now() };
    localStorage.setItem('chatThemes', JSON.stringify(preferences));
  } catch (e) {
    console.error('Failed to save theme preference', e);
  }
};

export const getThemePreference = (chatId) => {
  try {
    const preferences = JSON.parse(localStorage.getItem('chatThemes') || '{}');
    return preferences[chatId] ? preferences[chatId].themeId : 'default';
  } catch (e) {
    console.error('Failed to get theme preference', e);
    return 'default';
  }
};

export const getThemeById = (id) => chatThemes.find(t => t.id === id) || chatThemes[0];
