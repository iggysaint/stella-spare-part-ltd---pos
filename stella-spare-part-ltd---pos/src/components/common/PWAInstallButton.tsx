import React, { useState } from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { Download, Share2, PlusSquare, X } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running standalone, hide
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent hover:bg-accent-hover text-surface font-bold text-xs transition"
        title="Install POS App to Home Screen"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Install App</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border bg-surface-muted hover:bg-surface text-accent font-semibold text-xs transition"
          title="Install POS on iPad/iPhone"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Install on iPad</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-sm rounded-lg bg-surface p-6 shadow-xl text-primary border border-border">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-primary">Install Stella POS on iPad</h3>
                  <p className="text-xs text-secondary mt-0.5">Use as a full-screen counter register</p>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-lg hover:bg-surface-muted text-secondary hover:text-primary"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4 space-y-3 text-sm text-secondary">
                <div className="flex items-start gap-3 p-2.5 rounded-lg bg-surface-muted border border-border">
                  <div className="p-2 bg-accent-soft text-accent rounded-lg shrink-0">
                    <Share2 className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-primary">Step 1:</span> Tap the <strong>Share</strong> icon on the Safari toolbar.
                  </div>
                </div>

                <div className="flex items-start gap-3 p-2.5 rounded-lg bg-surface-muted border border-border">
                  <div className="p-2 bg-accent-soft text-accent rounded-lg shrink-0">
                    <PlusSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-primary">Step 2:</span> Scroll down and tap <strong>Add to Home Screen</strong>.
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-lg bg-accent hover:bg-accent-hover py-2.5 text-sm font-bold text-surface transition"
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
