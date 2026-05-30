import React from 'react';

/**
 * EmptyState — Unified, reusable empty/placeholder state component.
 *
 * THE FIX: The text container always carries `w-full max-w-md mx-auto text-center`
 * which mathematically prevents flexbox min-content text collapse regardless of
 * the parent flex context. This component is the single source of truth for all
 * empty-state UI across both admin and tenant panels.
 */

interface EmptyStateProps {
  /** Main heading text */
  title: string;
  /** Supporting description text */
  description: string;
  /** Icon or any ReactNode displayed above the title */
  icon: React.ReactNode;
  /** Optional CTA button or any action element rendered below the description */
  action?: React.ReactNode;
  /**
   * Visual variant:
   * - `card`  → white card with solid border (default, for "module under development")
   * - `dashed` → transparent background with dashed border (for empty lists)
   * - `inline` → no outer wrapper, bare inner content only (for use inside existing panels)
   */
  variant?: 'card' | 'dashed' | 'inline';
  /** Additional class names applied to the outermost wrapper */
  className?: string;
}

const wrapperVariants: Record<string, string> = {
  card: 'bg-white border border-slate-200 rounded-3xl shadow-sm',
  dashed: 'bg-white border border-dashed border-slate-200 rounded-3xl shadow-sm',
  inline: '',
};

export function EmptyState({
  title,
  description,
  icon,
  action,
  variant = 'dashed',
  className = '',
}: EmptyStateProps) {
  return (
    <div
      style={{ width: '100%', minWidth: '100%' }}
      className={[
        /* Outer Block wrapper — Immutable 100% width, ignores all flex/grid cross-axis shrink bugs */
        'block w-full p-8 mx-auto',
        wrapperVariants[variant],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* Icon shell */}
      <div className="w-16 h-16 mx-auto mb-6 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center text-slate-400 shrink-0">
        {icon}
      </div>

      {/*
       * TEXT CONTAINER
       */}
      <div style={{ display: 'block', width: '448px', margin: '0 auto', textAlign: 'center' }}>
        <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
        <p className="text-sm text-slate-500 leading-relaxed">{description}</p>

        {action && <div className="mt-6 flex justify-center">{action}</div>}
      </div>
    </div>
  );
}

export default EmptyState;
