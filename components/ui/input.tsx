import { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, hint, icon, id, ...props }, ref) => {
    const inputId = id || props.name;
    return (
      <div className="space-y-1.5 w-full">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-medium text-muted-foreground">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`
              w-full h-11 px-3.5 rounded-xl border border-border bg-card text-foreground
              text-sm placeholder:text-muted-foreground/60 shadow-xs
              transition-all duration-150
              focus:outline-none focus:ring-2 focus:ring-brand/15 focus:border-brand
              disabled:opacity-50 disabled:bg-muted disabled:cursor-not-allowed
              ${icon ? 'pl-10' : ''}
              ${error ? 'border-destructive focus:ring-destructive/15 focus:border-destructive' : ''}
              ${className}
            `}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
            {...props}
          />
        </div>
        {error && (
          <p id={`${inputId}-error`} className="text-xs font-medium text-destructive mt-1 animate-fade-in" role="alert">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={`${inputId}-hint`} className="text-xs text-muted-foreground mt-1">
            {hint}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = '', label, error, hint, id, ...props }, ref) => {
    const textareaId = id || props.name;
    return (
      <div className="space-y-1.5 w-full">
        {label && (
          <label htmlFor={textareaId} className="block text-xs font-medium text-muted-foreground">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={`
            w-full px-3.5 py-2.5 rounded-xl border border-border bg-card text-foreground
            text-sm placeholder:text-muted-foreground/60 resize-y min-h-[90px] shadow-xs
            transition-all duration-150
            focus:outline-none focus:ring-2 focus:ring-brand/15 focus:border-brand
            disabled:opacity-50 disabled:bg-muted disabled:cursor-not-allowed
            ${error ? 'border-destructive focus:ring-destructive/15 focus:border-destructive' : ''}
            ${className}
          `}
          aria-invalid={!!error}
          {...props}
        />
        {error && (
          <p className="text-xs font-medium text-destructive mt-1 animate-fade-in" role="alert">
            {error}
          </p>
        )}
        {hint && !error && (
          <p className="text-xs text-muted-foreground mt-1">
            {hint}
          </p>
        )}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = '', label, error, options, placeholder, id, ...props }, ref) => {
    const selectId = id || props.name;
    return (
      <div className="space-y-1.5 w-full">
        {label && (
          <label htmlFor={selectId} className="block text-xs font-medium text-muted-foreground">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={`
            w-full h-11 px-3.5 rounded-xl border border-border bg-card text-foreground
            text-sm shadow-xs transition-all duration-150 cursor-pointer
            focus:outline-none focus:ring-2 focus:ring-brand/15 focus:border-brand
            disabled:opacity-50 disabled:bg-muted disabled:cursor-not-allowed
            ${error ? 'border-destructive focus:ring-destructive/15 focus:border-destructive' : ''}
            ${className}
          `}
          aria-invalid={!!error}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="text-xs font-medium text-destructive mt-1 animate-fade-in" role="alert">{error}</p>}
      </div>
    );
  }
);
Select.displayName = 'Select';
