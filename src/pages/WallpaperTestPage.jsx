import { useState } from 'react';
import ChatWallpaperSelector from '../components/ChatWallpaperSelector';

const WallpaperTestPage = () => {
  const [showWallpaperSelector, setShowWallpaperSelector] = useState(true);
  const [chatWallpaper, setChatWallpaper] = useState({ wallpaperId: 'default', customImage: null });

  const handleSelectWallpaper = (wallpaperId, customImage) => {
    console.log('✅ Wallpaper Selected:', { wallpaperId, customImage });
    const newWallpaper = { wallpaperId, customImage };
    setChatWallpaper(newWallpaper);
    alert(`Wallpaper set ho gaya: ${wallpaperId}`);
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          🎨 Wallpaper Test Page
        </h1>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Current Wallpaper Settings:
          </h2>
          <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(chatWallpaper, null, 2)}
          </pre>
        </div>

        <button
          onClick={() => setShowWallpaperSelector(true)}
          className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-lg font-semibold shadow-lg"
        >
          🖼️ Open Wallpaper Selector
        </button>

        <div className="mt-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
            📝 Instructions:
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-yellow-700 dark:text-yellow-300">
            <li>Click the "Open Wallpaper Selector" button above</li>
            <li>Modal will open with 12 wallpaper options</li>
            <li>Click any wallpaper to select it</li>
            <li>Preview will show how it looks</li>
            <li>Click "Apply Wallpaper" button at bottom</li>
            <li>Alert will show with selected wallpaper name</li>
          </ol>
        </div>

        {/* Preview Area */}
        <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Preview Area (with current wallpaper):
          </h2>
          <div 
            className="h-64 rounded-lg border-2 border-gray-300 dark:border-gray-600 p-4 overflow-hidden"
            style={{
              backgroundImage: chatWallpaper.wallpaperId === 'custom' && chatWallpaper.customImage
                ? `url(${chatWallpaper.customImage})`
                : chatWallpaper.wallpaperId.startsWith('gradient-')
                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                : 'none',
              backgroundColor: chatWallpaper.wallpaperId === 'default' ? '#f9fafb' : 'transparent',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg p-4 inline-block">
              <p className="text-gray-900 dark:text-white font-medium">
                Sample Message 💬
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                This is how messages look with wallpaper
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Wallpaper Selector Modal */}
      <ChatWallpaperSelector
        isOpen={showWallpaperSelector}
        onClose={() => setShowWallpaperSelector(false)}
        currentWallpaper={chatWallpaper}
        onSelectWallpaper={handleSelectWallpaper}
      />
    </div>
  );
};

export default WallpaperTestPage;
