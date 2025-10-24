import { useState, useRef, useEffect } from 'react';
import { X, Image as ImageIcon, Check, Upload } from 'lucide-react';
import { chatWallpapers } from '../utils/chatWallpapers';
import toast from 'react-hot-toast';

const ChatWallpaperSelector = ({ isOpen, onClose, currentWallpaper, onSelectWallpaper }) => {
  const [selectedWallpaper, setSelectedWallpaper] = useState(currentWallpaper.wallpaperId);
  const [uploadedImage, setUploadedImage] = useState(currentWallpaper.customImage);
  const fileInputRef = useRef(null);

  // Update state when modal opens or currentWallpaper changes
  useEffect(() => {
    if (isOpen) {
      console.log('Modal opened with wallpaper:', currentWallpaper);
      setSelectedWallpaper(currentWallpaper.wallpaperId || 'default');
      setUploadedImage(currentWallpaper.customImage || null);
    }
  }, [isOpen, currentWallpaper]);

  if (!isOpen) return null;

  const handleWallpaperSelect = (wallpaperId) => {
    setSelectedWallpaper(wallpaperId);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedImage(e.target.result);
      setSelectedWallpaper('custom');
      toast.success('Image uploaded! Click Apply to set as wallpaper');
    };
    reader.readAsDataURL(file);
  };

  const handleApply = () => {
    onSelectWallpaper(selectedWallpaper, uploadedImage);
    onClose();
    toast.success('Wallpaper applied! 🎨', {
      icon: '✨',
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-primary rounded-lg">
              <ImageIcon className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Chat Wallpaper
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Choose a wallpaper for your chat background
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X size={24} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Wallpaper Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {chatWallpapers.map((wallpaper) => (
              <button
                key={wallpaper.id}
                onClick={() => handleWallpaperSelect(wallpaper.id)}
                className={`relative aspect-video rounded-xl overflow-hidden border-4 transition-all hover:scale-105 hover:shadow-lg ${
                  selectedWallpaper === wallpaper.id
                    ? 'border-primary-500 shadow-xl'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                {/* Preview */}
                <div
                  className="w-full h-full"
                  style={{
                    background: wallpaper.preview,
                    backgroundSize: wallpaper.size || 'cover',
                  }}
                >
                  {wallpaper.id === 'custom' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <Upload className="text-white" size={32} />
                    </div>
                  )}
                </div>

                {/* Selected indicator */}
                {selectedWallpaper === wallpaper.id && (
                  <div className="absolute top-2 right-2 bg-primary-500 text-white rounded-full p-1">
                    <Check size={16} />
                  </div>
                )}

                {/* Name */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                  <p className="text-xs font-medium text-white text-center">
                    {wallpaper.name}
                  </p>
                </div>
              </button>
            ))}
          </div>

          {/* Custom Upload Section */}
          {selectedWallpaper === 'custom' && (
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700">
              <div className="text-center">
                <ImageIcon className="mx-auto text-gray-400 mb-2" size={48} />
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Upload your custom wallpaper
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors inline-flex items-center gap-2"
                >
                  <Upload size={18} />
                  Choose Image
                </button>
                {uploadedImage && (
                  <div className="mt-4">
                    <img
                      src={uploadedImage}
                      alt="Preview"
                      className="max-h-32 mx-auto rounded-lg shadow-lg"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Preview Section */}
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Preview
            </h3>
            <div
              className="relative h-64 rounded-xl overflow-hidden border-2 border-gray-200 dark:border-gray-700 p-4"
              style={
                selectedWallpaper === 'custom' && uploadedImage
                  ? {
                      backgroundImage: `url(${uploadedImage})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }
                  : {
                      background: chatWallpapers.find(w => w.id === selectedWallpaper)?.preview,
                      backgroundSize: chatWallpapers.find(w => w.id === selectedWallpaper)?.size || 'cover',
                    }
              }
            >
              {/* Sample messages */}
              <div className="flex flex-col gap-2 h-full justify-end">
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-gray-800 rounded-2xl rounded-bl-sm px-4 py-2 max-w-[70%] shadow-lg">
                    <p className="text-sm text-gray-800 dark:text-gray-200">
                      Hey! How are you? 👋
                    </p>
                    <span className="text-xs text-gray-500">10:30 AM</span>
                  </div>
                </div>
                <div className="flex justify-end">
                  <div className="bg-primary-500 text-white rounded-2xl rounded-br-sm px-4 py-2 max-w-[70%] shadow-lg">
                    <p className="text-sm">I'm great! Love this wallpaper! 😍</p>
                    <span className="text-xs text-primary-100">10:31 AM</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <button
            onClick={onClose}
            className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="px-6 py-2.5 bg-gradient-primary text-white rounded-lg hover:shadow-lg transition-all font-medium hover-lift"
          >
            Apply Wallpaper
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatWallpaperSelector;
