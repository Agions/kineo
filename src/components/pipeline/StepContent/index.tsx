/**
 * StepContent — content primitives that consolidate the duplicated
 * "settings group → form items → controls" pattern found across
 * PropertyPanel, AudioSettings, SubtitleSettings and step-level editors.
 *
 * Before: every panel re-implemented `<div className={styles.settingsGroup}>`,
 * form rows, labels, and slider/select wrappers by hand.
 * After: panels compose these primitives for a consistent look with far less
 * duplication.
 *
 * NOTE: The shared UI controls (Slider, Select, Switch, ColorInput, TextArea)
 * already live in `@/components/ui`. This module supplies only the
 * *layout* primitives (group, item, row, label) that wire those controls
 * together — it does NOT re-implement controls.
 */

import type { LucideIcon } from 'lucide-react';

import { Switch } from '@/components/ui/switch';
import { cn } from '@/common/utils/class-names';

/* ------------------------------------------------------------------ */
/* Section heading                                                     */
/* ------------------------------------------------------------------ */

export interface StepContentGroupProps {
  title: React.ReactNode;
  icon?: LucideIcon;
  children: React.ReactNode;
  className?: string;
}

export function StepContentGroup({
  title,
  icon: Icon,
  children,
  className,
}: StepContentGroupProps) {
  return (
    <div className={cn('mb-6', className)}>
      <h5 className="mb-3 flex items-center gap-2 text-sm font-semibold">
        {Icon && <Icon size={16} className="inline" />}
        {title}
      </h5>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Form item (label + control)                                         */
/* ------------------------------------------------------------------ */

export interface StepContentItemProps {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  /** When true the control stretches full width below the label. */
  block?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function StepContentItem({
  label,
  hint,
  block = true,
  children,
  className,
}: StepContentItemProps) {
  return (
    <div className={cn('space-y-2', block ? 'w-full' : 'flex-1', className)}>
      {label && <label className="block text-xs font-medium text-muted-foreground">{label}</label>}
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Form row (two columns of items)                                     */
/* ------------------------------------------------------------------ */

export interface StepContentRowProps {
  children: React.ReactNode;
  className?: string;
}

export function StepContentRow({ children, className }: StepContentRowProps) {
  return <div className={cn('grid grid-cols-2 gap-4', className)}>{children}</div>;
}

/* ------------------------------------------------------------------ */
/* Generic section separator                                           */
/* ------------------------------------------------------------------ */

export function StepContentDivider({ className }: { className?: string }) {
  return <div className={cn('my-3 h-px w-full bg-border/60', className)} />;
}

/* ------------------------------------------------------------------ */
/* Switch row (label + switch)                                         */
/* ------------------------------------------------------------------ */

export interface StepContentSwitchProps {
  label: React.ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
}

export function StepContentSwitch({ label, checked, onChange, className }: StepContentSwitchProps) {
  return (
    <div className={cn('flex items-center justify-between', className)}>
      <span className="text-xs font-medium">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

export default {
  StepContentGroup,
  StepContentItem,
  StepContentRow,
  StepContentDivider,
  StepContentSwitch,
};
