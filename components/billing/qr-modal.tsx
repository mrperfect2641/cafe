'use client';

import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { buildUpiPayUri } from '@/lib/upi-qr';
import { formatMoneyAmount } from '@/lib/format-money';

type QrModalProps = {
  open: boolean;
  onClose: () => void;
  amount: number;
  note?: string;
};

export function QrModal({ open, onClose, amount, note }: QrModalProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setDataUrl(null);
      setError(null);
      return;
    }

    const uri = buildUpiPayUri(amount, note);
    if (!uri) {
      setError('Add NEXT_PUBLIC_UPI_VPA to .env.local to enable UPI QR.');
      setDataUrl(null);
      return;
    }

    let cancelled = false;
    setError(null);
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
        if (!cancelled) setError('Could not generate QR code.');
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
        {error ? (
          <p className="text-center text-sm text-destructive">{error}</p>
        ) : dataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- data URL from qrcode
          <img src={dataUrl} alt="UPI QR code" className="rounded-lg border bg-white p-2" />
        ) : (
          <div className="flex h-[280px] w-[280px] items-center justify-center rounded-lg border bg-muted text-sm text-muted-foreground">
            Generating…
          </div>
        )}
      </div>
    </Modal>
  );
}
