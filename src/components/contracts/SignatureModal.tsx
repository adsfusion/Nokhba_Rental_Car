'use client';

import { useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { X } from 'lucide-react';
import { motion } from 'motion/react';

type Props = {
  onSave: (dataUrl: string) => void;
  onCancel: () => void;
};

export function SignatureModal({ onSave, onCancel }: Props) {
  const sigCanvasRef = useRef<SignatureCanvas>(null);

  const handleSave = () => {
    if (!sigCanvasRef.current || sigCanvasRef.current.isEmpty()) return;
    onSave(sigCanvasRef.current.toDataURL('image/png'));
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-900">Client Signature</h3>
          <button onClick={onCancel} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg">
            <X size={18} />
          </button>
        </div>

        <div className="relative border-2 border-dashed border-slate-200 rounded-xl overflow-hidden bg-slate-50">
          <p className="absolute top-3 start-3 text-xs text-slate-300 font-medium pointer-events-none select-none">
            Sign Here
          </p>
          <SignatureCanvas
            ref={sigCanvasRef}
            penColor="black"
            canvasProps={{ className: 'w-full h-64', style: { touchAction: 'none' } }}
          />
        </div>

        <div className="flex items-center justify-between mt-4">
          <button
            onClick={() => sigCanvasRef.current?.clear()}
            className="text-sm font-semibold text-slate-500 hover:text-slate-700"
          >
            Clear
          </button>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-slate-600 text-sm font-semibold hover:text-slate-900"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors"
            >
              Save Signature
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
