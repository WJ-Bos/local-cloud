import { useEffect, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import StatusBadge from './StatusBadge';
import { getImageInfo, getInstanceTypeInfo } from './instanceCatalog';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';
const WS_BASE_URL = API_BASE_URL.replace(/^http/, 'ws');

/**
 * EC2 Instance Connect equivalent: an interactive shell in the browser,
 * bridged over a WebSocket to `docker exec` inside the instance.
 */
const InstanceTerminalModal = ({ instance, isOpen, onClose }) => {
  const containerRef = useRef(null);
  const termRef = useRef(null);
  const wsRef = useRef(null);
  const [connectionState, setConnectionState] = useState('connecting'); // connecting | connected | disconnected
  const [connectSeq, setConnectSeq] = useState(0);

  useEffect(() => {
    if (!isOpen || !instance || !containerRef.current) return;

    setConnectionState('connecting');

    const term = new Terminal({
      cursorBlink: true,
      fontFamily: '"JetBrains Mono", "Cascadia Mono", Consolas, monospace',
      fontSize: 13,
      theme: {
        background: '#0a0b16',
        foreground: '#d6d8e5',
        cursor: '#ffffff',
        selectionBackground: 'rgba(255,255,255,0.25)',
      },
    });
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(containerRef.current);
    fitAddon.fit();
    termRef.current = term;

    const ws = new WebSocket(`${WS_BASE_URL}/ws/instances/${instance.id}/terminal`);
    ws.binaryType = 'arraybuffer';
    wsRef.current = ws;

    const sendResize = () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'resize', cols: term.cols, rows: term.rows }));
      }
    };

    ws.onopen = () => {
      setConnectionState('connected');
      fitAddon.fit();
      sendResize();
      term.focus();
    };

    ws.onmessage = (event) => {
      term.write(new Uint8Array(event.data));
    };

    ws.onclose = (event) => {
      setConnectionState('disconnected');
      const reason = event.reason ? ` — ${event.reason}` : '';
      term.write(`\r\n\x1b[90m[session closed${reason}]\x1b[0m\r\n`);
    };

    ws.onerror = () => {
      setConnectionState('disconnected');
    };

    const dataDisposable = term.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'input', data }));
      }
    });

    const resizeObserver = new ResizeObserver(() => {
      try {
        fitAddon.fit();
        sendResize();
      } catch {
        /* container hidden mid-transition */
      }
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      dataDisposable.dispose();
      try { ws.close(); } catch { /* already closed */ }
      term.dispose();
      termRef.current = null;
      wsRef.current = null;
    };
  }, [isOpen, instance?.id, connectSeq]);

  useEffect(() => {
    const handleEscape = (e) => {
      // xterm swallows keys while focused; only close on Escape when terminal is disconnected
      if (e.key === 'Escape' && connectionState === 'disconnected') onClose();
    };
    if (isOpen) document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, connectionState, onClose]);

  if (!isOpen || !instance) return null;

  const imageInfo = getImageInfo(instance.image);
  const typeInfo = getInstanceTypeInfo(instance.instanceType);

  const stateConfig = {
    connecting:   { color: 'bg-amber-400',   label: 'Connecting…' },
    connected:    { color: 'bg-emerald-400', label: 'Connected' },
    disconnected: { color: 'bg-red-400',     label: 'Disconnected' },
  }[connectionState];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative island rounded-2xl w-full max-w-5xl flex flex-col overflow-hidden" style={{ height: '80vh' }}>

          {/* ── Header ──────────────────────────────────────── */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06] flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg ${imageInfo.bgColor} flex items-center justify-center p-1.5 flex-shrink-0`}>
                <img src={imageInfo.logo} alt={imageInfo.name} className="w-full h-full object-contain" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-white leading-none mb-0.5">
                  {instance.name}
                </h2>
                <p className="text-[11px] text-primary-gray-600">{imageInfo.name} · {typeInfo.name} — Web Console</p>
              </div>
              <StatusBadge status={instance.status} />
            </div>

            <div className="flex items-center gap-3">
              {/* Connection state */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03]">
                <span className={`w-1.5 h-1.5 rounded-full block ${stateConfig.color} ${connectionState === 'connected' ? 'running-dot' : ''}`} />
                <span className="text-xs font-medium text-primary-gray-400">{stateConfig.label}</span>
              </div>

              {connectionState === 'disconnected' && (
                <button
                  onClick={() => setConnectSeq(s => s + 1)}
                  className="px-3 py-1.5 bg-white hover:bg-white/90 text-black text-xs font-semibold rounded-lg transition-colors"
                >
                  Reconnect
                </button>
              )}

              <button
                onClick={onClose}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-primary-gray-600 hover:text-white hover:bg-white/[0.06] transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* ── Terminal ────────────────────────────────────── */}
          <div className="flex-1 min-h-0 bg-[#0a0b16] p-3">
            <div ref={containerRef} className="h-full w-full" />
          </div>

          {/* ── Footer ──────────────────────────────────────── */}
          <div className="flex items-center justify-between px-5 py-2 border-t border-white/[0.05] bg-black/20 flex-shrink-0">
            <span className="text-[11px] font-mono text-primary-gray-600">
              root@{instance.name} · shell via docker exec
            </span>
            <span className="text-[11px] text-primary-gray-700">
              Type <code className="text-primary-gray-500">exit</code> to end the session
            </span>
          </div>

        </div>
      </div>
    </div>
  );
};

export default InstanceTerminalModal;
