'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { QRCodeCanvas } from 'qrcode.react';
import { Copy, Check, ExternalLink, X } from 'lucide-react';

type Props = {
  contractId: string;
  onClose: () => void;
};

export function SignLinkPopover({ contractId, onClose }: Props) {
  const [origin, setOrigin] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const signUrl = origin ? `${origin}/sign/${contractId}` : '';

  const handleCopy = () => {
    if (!signUrl) return;
    navigator.clipboard.writeText(signUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl p-6 w-full max-w-[384px] shadow-2xl"
      >
        <div className="flex items-start justify-between mb-5">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Send for Signature</h3>
            <p className="text-xs text-slate-500 mt-0.5">Share this link or QR code with the client.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {signUrl ? (
          <div className="flex justify-center mb-4">
            <QRCodeCanvas value={signUrl} size={180} bgColor="#ffffff" fgColor="#0f172a" />
          </div>
        ) : (
          <div className="h-[180px] flex items-center justify-center text-slate-300 mb-4">
            Loading…
          </div>
        )}

        <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 mb-4">
          <p className="text-[11px] font-mono text-slate-500 break-all leading-relaxed">{signUrl}</p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center justify-center gap-2 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm transition-colors hover:bg-slate-800"
          >
            {copied ? <Check size={15} /> : <Copy size={15} />}
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
          <a
            href={signUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-bold text-sm transition-colors hover:bg-slate-200"
          >
            <ExternalLink size={15} />
            Open
          </a>
        </div>
      </motion.div>
    </div>
  );
}
