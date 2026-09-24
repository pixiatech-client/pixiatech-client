import React from 'react';
import { CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import { useProduct } from '../../context/ProductContext';

export const ToastNotification: React.FC = () => {
  const { toast } = useProduct();

  if (!toast || !toast.visible) return null;

  const icons = {
    success: <CheckCircle2 className="w-4 h-4 text-[#c6ff00]" />,
    error: <AlertTriangle className="w-4 h-4 text-red-400" />,
    info: <Info className="w-4 h-4 text-cyan-400" />
  };

  const borders = {
    success: 'border-[#c6ff00]/40 bg-[#0e120a]/95 text-white',
    error: 'border-red-500/40 bg-[#160b0d]/95 text-white',
    info: 'border-cyan-500/40 bg-[#0a1216]/95 text-white'
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300 pointer-events-none">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl backdrop-blur-md ${borders[toast.type]}`}>
        {icons[toast.type]}
        <p className="text-xs sm:text-sm font-medium">{toast.message}</p>
      </div>
    </div>
  );
};
