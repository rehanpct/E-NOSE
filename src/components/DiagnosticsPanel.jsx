import React, { useEffect, useState } from 'react';
import { useDroneData } from '../context/DroneDataContext';
import { Terminal } from 'lucide-react';

export default function DiagnosticsPanel() {
  const {
    socketConnected,
    socketReconnecting,
    transportType,
    lastReceivedTimestamp,
    backendConnected,
    reconnectCount,
    totalReconnects,
    lastHealthCheckResult,
  } = useDroneData();

  const [visible, setVisible] = useState(false);
  const [timeSince, setTimeSince] = useState('N/A');

  useEffect(() => {
    // Check if query param or localStorage has dev diagnostics enabled
    const urlParams = new URLSearchParams(window.location.search);
    const hasDiagParam = urlParams.get('diag') === 'true';
    const hasDiagStorage = localStorage.getItem('devDiagnostics') === 'true';
    
    if (hasDiagParam || hasDiagStorage) {
      setVisible(true);
    }
  }, []);

  // Compute time since last telemetry dynamically
  useEffect(() => {
    if (!visible) return;
    
    const interval = setInterval(() => {
      if (lastReceivedTimestamp) {
        const diffSeconds = Math.round((new Date() - new Date(lastReceivedTimestamp)) / 1000);
        setTimeSince(`${diffSeconds}s`);
      } else {
        setTimeSince('N/A');
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lastReceivedTimestamp, visible]);

  if (!visible) return null;

  return (
    <div 
      className="fixed bottom-4 right-4 z-50 p-4 w-72 rounded-2xl border bg-slate-900/95 text-slate-100 border-slate-700 shadow-2xl backdrop-blur-md"
      style={{ fontFamily: 'monospace', fontSize: '11px' }}
    >
      <div className="flex items-center justify-between border-b border-slate-700 pb-2 mb-3">
        <div className="flex items-center gap-2 text-primary-400 font-bold">
          <Terminal size={14} />
          <span>SOCKET DIAGNOSTICS</span>
        </div>
        <button 
          onClick={() => setVisible(false)} 
          className="text-slate-400 hover:text-slate-200 transition-colors text-xs font-bold px-1"
        >
          [X]
        </button>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex justify-between">
          <span className="text-slate-400">Socket Status:</span>
          <span className={socketConnected ? "text-emerald-400 font-bold" : "text-rose-400 font-bold animate-pulse"}>
            {socketConnected ? "CONNECTED" : "DISCONNECTED"}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-slate-400">Transport Type:</span>
          <span className="text-blue-400 font-bold uppercase">{transportType}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-slate-400">Reconnect Attempt:</span>
          <span className="text-amber-400 font-bold">{reconnectCount}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-slate-400">Total Reconnects:</span>
          <span className="text-amber-400 font-bold">{totalReconnects}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-slate-400">WS Reconnecting:</span>
          <span className={socketReconnecting ? "text-amber-400 font-bold" : "text-slate-500"}>
            {socketReconnecting ? "YES" : "NO"}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-slate-400">Backend Reachable:</span>
          <span className={backendConnected ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
            {backendConnected ? "ONLINE" : "OFFLINE"}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-slate-400">Health Check:</span>
          <span
            className={
              lastHealthCheckResult === 'ok'
                ? 'text-emerald-400 font-bold'
                : lastHealthCheckResult === 'failed'
                  ? 'text-rose-400 font-bold'
                  : 'text-slate-400'
            }
          >
            {lastHealthCheckResult.toUpperCase()}
          </span>
        </div>

        <div className="flex justify-between border-t border-slate-800/80 pt-2 mt-1">
          <span className="text-slate-400">Last Telemetry:</span>
          <span className="text-slate-200">
            {lastReceivedTimestamp ? new Date(lastReceivedTimestamp).toLocaleTimeString() : 'NEVER'}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-slate-400 font-medium">Time Since Last:</span>
          <span className={`font-bold ${timeSince !== 'N/A' && parseInt(timeSince) > 30 ? 'text-amber-400' : 'text-slate-200'}`}>
            {timeSince}
          </span>
        </div>
      </div>
    </div>
  );
}
