import { useState, useEffect, useRef } from 'react';
import { Check, X } from 'lucide-react';
import { chatThemes } from '../utils/chatThemes';

const ThemeSelector = ({ isOpen, onClose, currentThemeId, onApply }) => {
  const [selected, setSelected] = useState(currentThemeId || 'default');
  const containerRef = useRef(null);

  useEffect(() => {
    if (isOpen) setSelected(currentThemeId || 'default');
  }, [isOpen, currentThemeId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div ref={containerRef} className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Choose Theme</h3>
          <button onClick={onClose} className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
            <X size={18} />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {chatThemes.map((theme) => (
            <button
              key={theme.id}
              onClick={() => setSelected(theme.id)}
              className={`rounded-lg p-2 h-28 flex flex-col justify-end items-start relative overflow-hidden border-2 ${selected === theme.id ? 'ring-2 ring-primary-500' : 'border-transparent'}`}
              style={{ background: theme.gradient }}
            >
              <div className="p-2 rounded bg-black/25 text-white text-sm font-medium">{theme.name}</div>
              {selected === theme.id && (
                <div className="absolute top-2 right-2 bg-white/80 rounded-full p-1">
                  <Check size={14} />
                </div>
              )}
            </button>
          ))}
        </div>

        <div className="mt-4 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded border">Cancel</button>
          <button onClick={() => onApply(selected)} className="px-4 py-2 rounded bg-primary-600 text-white">Apply Theme</button>
        </div>
      </div>
    </div>
  );
};

export default ThemeSelector;
