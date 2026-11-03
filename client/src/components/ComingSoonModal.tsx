import { Sparkles, X } from "lucide-react";
import "./ComingSoonModal.css";

type ComingSoonModalProps = {
  open: boolean;
  onClose: () => void;
};

export function ComingSoonModal({ open, onClose }: ComingSoonModalProps) {
  if (!open) return null;

  return (
    <div
      className="cj-coming-backdrop"
      role="presentation"
      onMouseDown={event => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="cj-coming-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cj-coming-title"
      >
        <button className="cj-coming-close" type="button" onClick={onClose} aria-label="Close">
          <X size={18} />
        </button>
        <span className="cj-coming-orb"><Sparkles size={26} /></span>
        <h2 id="cj-coming-title">Coming Soon</h2>
        <button className="cj-coming-dismiss" type="button" onClick={onClose}>Close</button>
      </section>
    </div>
  );
}
