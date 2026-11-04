"use client";
import { useEffect, type ReactNode } from "react";
import { XIcon, ShieldIcon, InfoIcon } from "@/components/icons";

// Order summary shown before payment. In live mode the primary action opens
// Razorpay Checkout (the amount is always recomputed on the server); in demo
// mode it activates access locally with no charge.
export default function CheckoutSheet({
  heading = "Review your order",
  itemTitle,
  itemSub,
  cover,
  lines,
  total,
  live,
  busy,
  onPay,
  onClose,
}: {
  heading?: string;
  itemTitle: string;
  itemSub: string;
  cover: ReactNode;
  lines: [string, string][];
  total: number;
  live: boolean;
  busy: boolean;
  onPay: () => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !busy) onClose(); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [busy, onClose]);

  const rupees = "₹" + total.toLocaleString("en-IN");

  return (
    <div className="sheet-bg" role="dialog" aria-modal="true" aria-labelledby="sheet-title" onClick={(e) => { if (e.target === e.currentTarget && !busy) onClose(); }}>
      <div className="sheet">
        <div className="sheet-head">
          <div>
            <h2 id="sheet-title">{heading}</h2>
            <p>{live ? "You’ll pay on Razorpay’s secure checkout." : "Demo mode: no payment is taken."}</p>
          </div>
          <button className="icon-btn" onClick={onClose} disabled={busy} aria-label="Close"><XIcon size={20} /></button>
        </div>
        <div className="sheet-body">
          <div className="sheet-item">
            {cover}
            <div style={{ minWidth: 0 }}>
              <b>{itemTitle}</b>
              <span>{itemSub}</span>
            </div>
          </div>
          <div className="sheet-lines">
            {lines.map(([k, v]) => <div className="kv" key={k}><span>{k}</span><b>{v}</b></div>)}
          </div>
          <div className="sheet-total"><span>Total</span><b>{rupees}</b></div>
          <div className="sheet-acts">
            <button className="btn lg block" onClick={onPay} disabled={busy} autoFocus>
              {busy ? "Opening checkout…" : live ? `Pay ${rupees}` : "Activate without paying"}
            </button>
            <button className="btn ghost block" onClick={onClose} disabled={busy}>Cancel</button>
          </div>
          {live ? (
            <p className="sheet-fine"><ShieldIcon size={16} />UPI, cards, net banking and wallets via Razorpay. Access is granted only after the payment is verified.</p>
          ) : (
            <p className="sheet-fine"><InfoIcon size={16} />Razorpay keys aren’t configured, so this checkout is simulated and nothing is charged.</p>
          )}
        </div>
      </div>
    </div>
  );
}
