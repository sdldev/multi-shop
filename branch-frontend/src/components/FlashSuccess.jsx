import { useEffect } from 'react';
import { Check, Save, Trash2, Copy, Send } from 'lucide-react';

const iconComponents = {
  check: Check,
  save: Save,
  delete: Trash2,
  copy: Copy,
  send: Send,
};

export default function FlashSuccess({ show, onComplete, message = 'Berhasil!', icon = 'check' }) {
  useEffect(() => {
    if (show) {
      // Auto hide after 1.5 seconds
      const timer = setTimeout(() => {
        onComplete();
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!show) return null;

  const IconComponent = iconComponents[icon] || Check;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
      {/* Backdrop with slight blur */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm animate-in fade-in duration-200" />
      
      {/* Success Icon and Message */}
      <div className="relative animate-in zoom-in-95 fade-in duration-300">
        <div className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center gap-4">
          {/* Icon Circle */}
          <div className="relative">
            {/* Outer ring animation */}
            <div className="absolute inset-0 rounded-full border-4 border-green-500 animate-ping opacity-75" />
            
            {/* Success circle */}
            <div className="relative w-20 h-20 bg-green-500 rounded-full flex items-center justify-center">
              {/* Dynamic Icon */}
              <IconComponent className="w-12 h-12 text-white animate-in zoom-in duration-500 delay-150" />
            </div>
          </div>
          
          {/* Message */}
          <p className="text-lg font-semibold text-gray-800 animate-in fade-in slide-in-from-bottom-2 duration-300 delay-200">
            {message}
          </p>
        </div>
      </div>
    </div>
  );
}
