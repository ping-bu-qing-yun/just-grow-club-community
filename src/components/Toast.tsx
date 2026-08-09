import { CheckCircle2, X } from 'lucide-react';
import { useEffect, useRef } from 'react';

export function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const timer = window.setTimeout(() => onCloseRef.current(), 3000);
    return () => window.clearTimeout(timer);
  }, [message]);

  return (
    <div className="toast" role="status">
      <CheckCircle2 size={19} />
      <span>{message}</span>
      <button type="button" className="icon-button icon-button--small" aria-label="关闭提示" onClick={onClose}><X size={16} /></button>
    </div>
  );
}
