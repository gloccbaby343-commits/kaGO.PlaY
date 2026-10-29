import React, { useState } from 'react';
import { Download, Smartphone, X, CheckCircle2 } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [showFallbackModal, setShowFallbackModal] = useState(false);

  if (isInstalled) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-[#16161a] border border-[#ff3e3e]/40 text-[#ff3e3e] text-xs font-mono">
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span className="label !text-[#ff3e3e] !opacity-100">Installed</span>
      </div>
    );
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      await install();
    } else if (isIOS) {
      setShowIOSGuide(true);
    } else {
      setShowFallbackModal(true);
    }
  };

  return (
    <>
      <button
        onClick={handleInstallClick}
        aria-label="Install kaGO.PIaY Offline Music Player App"
        className={`flex items-center gap-2 rounded-sm transition font-syne font-bold text-xs uppercase tracking-wider active:scale-95 cursor-pointer ${
          compact
            ? 'px-3 py-1.5 bg-[#f2efeb] hover:bg-white text-[#0c0c0e]'
            : 'px-4 py-2.5 bg-[#f2efeb] hover:bg-white text-[#0c0c0e]'
        }`}
      >
        <Download className="w-3.5 h-3.5" />
        <span>Install App</span>
      </button>

      {/* iOS Safari Guide Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-sm bg-[#16161a] border-2 border-[#f2efeb] p-6 text-[#f2efeb]">
            <div className="flex items-center justify-between pb-3 border-b border-[#f2efeb]/15">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-[#ff3e3e]" />
                <h3 className="text-base font-syne font-bold">Install on iOS / Safari</h3>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="p-1 text-[#f2efeb]/60 hover:text-[#f2efeb] cursor-pointer"
                aria-label="Close iOS guide"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mt-4 space-y-3 text-xs text-[#f2efeb]/80">
              <div className="flex items-start gap-3">
                <span className="label !opacity-100 font-bold text-[#ff3e3e]">01</span>
                <p>Tap the <strong className="text-white">Share</strong> button in Safari toolbar.</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="label !opacity-100 font-bold text-[#ff3e3e]">02</span>
                <p>Scroll down and select <strong className="text-white">Add to Home Screen</strong>.</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="label !opacity-100 font-bold text-[#ff3e3e]">03</span>
                <p>Tap <strong className="text-white">Add</strong> in top right. kaGO.PIaY installs offline!</p>
              </div>
            </div>
            <button
              onClick={() => setShowIOSGuide(false)}
              className="mt-6 w-full py-2.5 rounded-sm bg-[#ff3e3e] hover:bg-[#e03030] text-[#0c0c0e] font-syne font-bold text-xs uppercase tracking-wider transition active:scale-95 cursor-pointer"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* General PWA Info Modal */}
      {showFallbackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-sm bg-[#16161a] border-2 border-[#f2efeb] p-6 text-[#f2efeb]">
            <div className="flex items-center justify-between pb-3 border-b border-[#f2efeb]/15">
              <h3 className="text-base font-syne font-bold">Install Offline Player</h3>
              <button
                onClick={() => setShowFallbackModal(false)}
                className="p-1 text-[#f2efeb]/60 hover:text-[#f2efeb] cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="mt-3 text-xs text-[#f2efeb]/80 leading-relaxed">
              Install kaGO.PIaY onto your device for offline playback and lock-screen controls:
            </p>
            <ul className="mt-3 space-y-2 text-xs text-[#f2efeb]/80 list-disc list-inside bg-[#0c0c0e] p-3 rounded-sm border border-[#f2efeb]/10 font-mono">
              <li><strong className="text-white">Desktop:</strong> Click install icon in URL address bar.</li>
              <li><strong className="text-white">Android:</strong> Browser menu (⋮) → "Install app".</li>
            </ul>
            <button
              onClick={() => setShowFallbackModal(false)}
              className="mt-5 w-full py-2.5 rounded-sm bg-[#ff3e3e] hover:bg-[#e03030] text-[#0c0c0e] font-syne font-bold text-xs uppercase tracking-wider transition active:scale-95 cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </>
  );
};
