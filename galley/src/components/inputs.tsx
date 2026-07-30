import { forwardRef, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";

const baseClasses =
  "w-full rounded-md border border-navy/15 bg-white px-3.5 py-2.5 text-navy placeholder:text-navy/35 transition-colors focus:border-brass focus:outline-none disabled:cursor-not-allowed disabled:opacity-60";

export const TextInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function TextInput(props, ref) {
    return <input ref={ref} className={baseClasses} {...props} />;
  },
);

export const TextArea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function TextArea(props, ref) {
    return <textarea ref={ref} rows={4} className={baseClasses} {...props} />;
  },
);

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function Select(props, ref) {
    return (
      <select ref={ref} className={`${baseClasses} bg-white`} {...props} />
    );
  },
);
