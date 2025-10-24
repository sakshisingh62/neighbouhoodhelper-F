// Chat wallpaper configurations
export const chatWallpapers = [
  {
    id: 'default',
    name: 'Default',
    type: 'color',
    value: '#f9fafb',
    darkValue: '#111827',
    preview: 'linear-gradient(135deg, #f9fafb 0%, #e5e7eb 100%)',
  },
  {
    id: 'gradient-purple',
    name: 'Purple Dream',
    type: 'gradient',
    value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    preview: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
  {
    id: 'gradient-ocean',
    name: 'Ocean Blue',
    type: 'gradient',
    value: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    preview: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  },
  {
    id: 'gradient-sunset',
    name: 'Sunset',
    type: 'gradient',
    value: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    preview: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  },
  {
    id: 'gradient-forest',
    name: 'Forest Green',
    type: 'gradient',
    value: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
    preview: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
  },
  {
    id: 'gradient-midnight',
    name: 'Midnight',
    type: 'gradient',
    value: 'linear-gradient(135deg, #2c3e50 0%, #3498db 100%)',
    preview: 'linear-gradient(135deg, #2c3e50 0%, #3498db 100%)',
  },
  {
    id: 'gradient-rose',
    name: 'Rose Gold',
    type: 'gradient',
    value: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    preview: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  },
  {
    id: 'pattern-dots',
    name: 'Dotted',
    type: 'pattern',
    value: 'radial-gradient(circle, #667eea 1px, transparent 1px)',
    size: '20px 20px',
    backgroundColor: '#f9fafb',
    preview: 'radial-gradient(circle, #667eea 1px, transparent 1px)',
  },
  {
    id: 'pattern-grid',
    name: 'Grid',
    type: 'pattern',
    value: 'linear-gradient(#e5e7eb 1px, transparent 1px), linear-gradient(90deg, #e5e7eb 1px, transparent 1px)',
    size: '20px 20px',
    backgroundColor: '#f9fafb',
    preview: 'linear-gradient(#e5e7eb 2px, transparent 2px), linear-gradient(90deg, #e5e7eb 2px, transparent 2px)',
  },
  {
    id: 'pattern-diagonal',
    name: 'Diagonal Stripes',
    type: 'pattern',
    value: 'repeating-linear-gradient(45deg, #f9fafb, #f9fafb 10px, #e5e7eb 10px, #e5e7eb 20px)',
    preview: 'repeating-linear-gradient(45deg, #f9fafb, #f9fafb 10px, #e5e7eb 10px, #e5e7eb 20px)',
  },
  {
    id: 'image-geometry',
    name: 'Geometric',
    type: 'image',
    value: 'url("https://www.transparenttextures.com/patterns/cubes.png")',
    backgroundColor: '#f9fafb',
    preview: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
  {
    id: 'custom',
    name: 'Custom Image',
    type: 'custom',
    value: null,
    preview: 'linear-gradient(135deg, #ffd89b 0%, #19547b 100%)',
  },
];

// Get wallpaper style - returns inline style object
export const getWallpaperStyle = (wallpaperId, customImage = null) => {
  const wallpaper = chatWallpapers.find(w => w.id === wallpaperId) || chatWallpapers[0];
  console.log('Getting wallpaper style for:', wallpaperId, 'Wallpaper:', wallpaper);

  if (wallpaperId === 'custom' && customImage) {
    const style = {
      backgroundImage: `url(${customImage})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      backgroundColor: 'transparent',
    };
    console.log('Custom wallpaper style:', style);
    return style;
  }

  let style;
  switch (wallpaper.type) {
    case 'gradient':
      style = {
        background: wallpaper.value,
        backgroundColor: 'transparent',
      };
      break;
    case 'pattern':
      style = {
        backgroundColor: wallpaper.backgroundColor,
        backgroundImage: wallpaper.value,
        backgroundSize: wallpaper.size || 'auto',
        backgroundRepeat: 'repeat',
      };
      break;
    case 'image':
      style = {
        backgroundColor: wallpaper.backgroundColor,
        backgroundImage: wallpaper.value,
        backgroundSize: 'auto',
        backgroundRepeat: 'repeat',
      };
      break;
    case 'color':
    default:
      const isDark = document.documentElement.classList.contains('dark');
      style = {
        backgroundColor: isDark ? wallpaper.darkValue : wallpaper.value,
        backgroundImage: 'none',
      };
      break;
  }
  
  console.log('Final wallpaper style:', style);
  return style;
};

// Save wallpaper preference
export const saveWallpaperPreference = (chatId, wallpaperId, customImage = null) => {
  const preferences = JSON.parse(localStorage.getItem('chatWallpapers') || '{}');
  preferences[chatId] = {
    wallpaperId,
    customImage,
    timestamp: Date.now(),
  };
  localStorage.setItem('chatWallpapers', JSON.stringify(preferences));
};

// Get wallpaper preference
export const getWallpaperPreference = (chatId) => {
  const preferences = JSON.parse(localStorage.getItem('chatWallpapers') || '{}');
  return preferences[chatId] || { wallpaperId: 'default', customImage: null };
};
