"use client";
import {
  Children,
  cloneElement,
  isValidElement,
  useEffect,
  useId,
  useRef,
  type ReactElement,
  type ReactNode,
} from "react";
import { motion, useReducedMotion } from "motion/react";
import { X, Check, ChevronRight, FileText, Inbox, Loader2 } from "lucide-react";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="brand">
      <span className="brand-mark">
        <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <path
            d="M16 5 26 10v9c0 5-10 9-10 9S6 24 6 19v-9L16 5Z"
            stroke="currentColor"
            strokeWidth="1.7"
          />
          <path
            d="m12 16 3 3 6-7"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      {!compact && (
        <span>
          estate<span className="brand-light">unlock</span>
          <small>A CLEAR PATH FORWARD</small>
        </span>
      )}
    </div>
  );
}
export function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: string;
}) {
  return (
    <span className={`badge ${tone}`}>
      <span className="badge-dot" />
      {children}
    </span>
  );
}
export function Button({
  children,
  onClick,
  kind = "primary",
  className = "",
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { kind?: string }) {
  return (
    <button className={`btn ${kind} ${className}`} onClick={onClick} {...rest}>
      {children}
    </button>
  );
}
export function Empty({
  title = "No items yet",
  description = "New activity will appear here.",
  action,
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="empty">
      <span className="empty-icon">
        <Inbox size={25} />
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}
export function Loading() {
  return (
    <div className="loading" role="status">
      <Loader2 className="spin" size={24} />
      <span>Opening your workspace…</span>
    </div>
  );
}
export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  const id = useId();
  const hintId = `${id}-hint`;
  const connectControl = (nodes: ReactNode): ReactNode =>
    Children.map(nodes, (child) => {
      if (!isValidElement(child)) return child;
      const element = child as ReactElement<{
        children?: ReactNode;
        id?: string;
        "aria-describedby"?: string;
      }>;
      if (
        typeof element.type === "string" &&
        ["input", "select", "textarea"].includes(element.type)
      ) {
        return cloneElement(element, {
          id,
          "aria-describedby":
            [element.props["aria-describedby"], hint ? hintId : null]
              .filter(Boolean)
              .join(" ") || undefined,
        });
      }
      return element.props.children
        ? cloneElement(element, {}, connectControl(element.props.children))
        : element;
    });
  return (
    <div className="field">
      <label className="control-label" htmlFor={id}>
        <span>{label}</span>
      </label>
      {connectControl(children)}
      {hint && <small id={hintId}>{hint}</small>}
    </div>
  );
}
export function ErrorBox({ message }: { message: string }) {
  return message ? (
    <div className="error-box" role="alert">
      {message}
    </div>
  ) : null;
}
export function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
  );
}
export function Modal({
  title,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  useEffect(() => {
    const prev = document.activeElement as HTMLElement;
    const el = ref.current;
    const nodes = () =>
      Array.from(
        el?.querySelectorAll<HTMLElement>(
          'button:not([disabled]),a[href],input,select,textarea,[tabindex="0"]',
        ) || [],
      );
    nodes()[0]?.focus();
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        const all = nodes();
        if (e.shiftKey && document.activeElement === all[0]) {
          e.preventDefault();
          all.at(-1)?.focus();
        } else if (!e.shiftKey && document.activeElement === all.at(-1)) {
          e.preventDefault();
          all[0]?.focus();
        }
      }
    };
    document.addEventListener("keydown", handler);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = previous;
      prev?.focus();
    };
  }, [onClose]);
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        ref={ref}
        className={`modal ${wide ? "wide" : ""}`}
        initial={{ opacity: 0, y: reduce ? 0 : 18, scale: reduce ? 1 : 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", bounce: 0, duration: 0.3 }}
      >
        <div className="modal-head">
          <h2>{title}</h2>
          <button
            aria-label="Close dialog"
            className="icon-btn"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </motion.div>
    </div>
  );
}
export function FileIcon({ small = false }: { small?: boolean }) {
  return (
    <span className={`file-icon ${small ? "small" : ""}`}>
      <FileText size={small ? 17 : 22} />
    </span>
  );
}
export function Stepper({
  stage,
  labels,
}: {
  stage: number;
  labels: string[];
}) {
  return (
    <ol className="stepper" aria-label="Estate case journey">
      {labels.map((label, i) => (
        <li
          key={label}
          className={i < stage ? "done" : i === stage ? "current" : ""}
        >
          <span className="step-number">
            {i < stage ? <Check size={14} /> : i + 1}
          </span>
          <span>{label}</span>
          {i < labels.length - 1 && (
            <ChevronRight size={12} className="step-arrow" />
          )}
        </li>
      ))}
    </ol>
  );
}
