import { CheckCircle2, X } from 'lucide-react';

export function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="toast" role="status">
      <CheckCircle2 size={19} />
      <span>{message}</span>
      <button type="button" className="icon-button icon-button--small" aria-label="关闭提示" onClick={onClose}><X size={16} /></button>
    </div>
  );
}

