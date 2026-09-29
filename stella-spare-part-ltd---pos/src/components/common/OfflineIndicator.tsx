import React from 'react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { Wifi, WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  return (
    <div
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold select-none ${
        isOnline
          ? 'bg-positive-soft text-positive border-positive'
          : 'bg-surface-muted text-warning border-warning'
      }`}
      title={isOnline ? 'Internet connected' : 'No internet connection'}
    >
      <span
        className={`w-2 h-2 rounded-lg ${
          isOnline ? 'bg-positive' : 'bg-warning'
        }`}
      />
      {isOnline ? (
        <span className="flex items-center gap-1">
          <Wifi className="w-3.5 h-3.5" />
          <span>Online</span>
        </span>
      ) : (
        <span className="flex items-center gap-1">
          <WifiOff className="w-3.5 h-3.5" />
          <span>Offline</span>
        </span>
      )}
    </div>
  );
};
