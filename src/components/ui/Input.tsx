/**
 * Input — text field, textarea, and select, unified on the Apple material
 * surface. Focus uses the brand ring (SKILL §16 feedback: validate inline).
 */
import { forwardRef, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import styles from './Input.module.css';

type CommonProps = {
  label?: ReactNode;
  error?: string;
  hint?: string;
  id?: string;
};

export type InputProps = CommonProps & InputHTMLAttributes<HTMLInputElement>;
export type TextareaProps = CommonProps & TextareaHTMLAttributes<HTMLTextAreaElement>;
export type SelectProps = CommonProps & SelectHTMLAttributes<HTMLSelectElement>;

function FieldShell({
  label,
  error,
  hint,
  id,
  children,
}: CommonProps & { children: ReactNode }) {
  return (
    <div className={styles.field}>
      {label ? (
        <label className={styles.label} htmlFor={id}>
          {label}
        </label>
      ) : null}
      {children}
      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className={styles.hint}>{hint}</p>
      ) : null}
    </div>
  );
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, id, className = '', ...rest },
  ref,
) {
  return (
    <FieldShell label={label} error={error} hint={hint} id={id}>
      <input ref={ref} id={id} className={`${styles.control} ${error ? styles.invalid : ''} ${className}`} {...rest} />
    </FieldShell>
  );
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, hint, id, className = '', ...rest },
  ref,
) {
  return (
    <FieldShell label={label} error={error} hint={hint} id={id}>
      <textarea ref={ref} id={id} className={`${styles.control} ${styles.textarea} ${error ? styles.invalid : ''} ${className}`} {...rest} />
    </FieldShell>
  );
});

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, hint, id, className = '', children, ...rest },
  ref,
) {
  return (
    <FieldShell label={label} error={error} hint={hint} id={id}>
      <select ref={ref} id={id} className={`${styles.control} ${error ? styles.invalid : ''} ${className}`} {...rest}>
        {children}
      </select>
    </FieldShell>
  );
});
