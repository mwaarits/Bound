'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

export function QrScanner({ onScan }: { onScan: (payload: string) => void }) {
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  async function start() {
    setScanning(true);
    try {
      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decoded) => { onScan(decoded); stop(); },
        () => {}
      );
    } catch { setScanning(false); }
  }

  function stop() {
    scannerRef.current?.stop().then(() => setScanning(false)).catch(() => setScanning(false));
  }

  useEffect(() => () => { scannerRef.current?.stop().catch(() => {}); }, []);

  return (
    <div className="space-y-3">
      <div id="qr-reader" className="rounded-lg overflow-hidden" />
      {!scanning ? (
        <button onClick={start} className="w-full min-h-[48px] rounded-default bg-brand-primary text-text-on-dark p-3 text-body-lg">Scan QR Kamera</button>
      ) : (
        <button onClick={stop} className="w-full min-h-[48px] rounded-default bg-bg-surface p-3 text-body-lg border border-border-subtle">Berhenti Scan</button>
      )}
    </div>
  );
}