'use client';

import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { buildUpiPayUri } from '@/lib/upi-qr';
import { formatMoneyAmount } from '@/lib/format-money';
import { Copy } from 'lucide-react';

type QrModalProps = {
  open: boolean;
  onClose: () => void;
  amount: number;
  note?: string;
};

export function QrModal({ open, onClose, amount, note }: QrModalProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [copyState, setCopyState] = useState<'idle' | 'copied'>('idle');

  const upiVpa = process.env.NEXT_PUBLIC_UPI_VPA?.trim() ?? '';

  useEffect(() => {
    if (!open) {
      setDataUrl(null);
      setMessage(null);
      setCopyState('idle');
      return;
    }

    const uri = buildUpiPayUri(amount, note);
    if (!uri) {
      setMessage('UPI QR is not configured yet. Ask your admin to set NEXT_PUBLIC_UPI_VPA.');
      setDataUrl(null);
      return;
    }

    let cancelled = false;
    setMessage(null);
    void import('qrcode')
      .then((QR) =>
        QR.default.toDataURL(uri, {
          margin: 2,
          width: 280,
          color: { dark: '#000000', light: '#ffffff' },
        }),
      )
      .then((url) => {
        if (!cancelled) setDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setMessage('Could not generate QR code.');
      });

    return () => {
      cancelled = true;
    };
  }, [open, amount, note]);

  return (
    <Modal open={open} onClose={onClose} title="Pay with UPI">
      <div className="flex flex-col items-center gap-4">
        <p className="text-center text-sm text-muted-foreground">
          Scan to pay {formatMoneyAmount(amount)}
        </p>
        {message ? (
          <p className="text-center text-sm text-muted-foreground">{message}</p>
        ) : dataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- data URL from qrcode
          <img src={dataUrl} alt="UPI QR code" className="rounded-lg border bg-white p-2" />
        ) : (
          <div className="flex h-[280px] w-[280px] items-center justify-center rounded-lg border bg-muted text-sm text-muted-foreground">
            Generating…
          </div>
        )}

        {dataUrl && upiVpa ? (
          <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
            <p className="flex-1 truncate text-center text-sm font-medium text-foreground">{upiVpa}</p>
            <button
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(upiVpa);
                  setCopyState('copied');
                  setTimeout(() => setCopyState('idle'), 1200);
                } catch {
                  // no-op; clipboard might be blocked
                }
              }}
              className="inline-flex items-center gap-2 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-muted/50"
              aria-label="Copy UPI ID"
            >
              <Copy className="h-3.5 w-3.5" />
              {copyState === 'copied' ? 'Copied' : 'Copy'}
            </button>
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
