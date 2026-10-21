import React from 'react';

export interface AppLayoutProps {
  /** Content slot - rendered in the center area */
  children?: React.ReactNode;
  /** Header slot - rendered at the top */
  header?: React.ReactNode;
  /** Sidebar slot - rendered on the left */
  sidebar?: React.ReactNode;
  /** Footer slot - rendered at the bottom */
  footer?: React.ReactNode;
}

/**
 * Named slot components - simply pass through the provided values
 * These allow consumers to use AppLayout.Header etc. as a pattern.
 *
 * Exported with UPPER_CASE names for ergonomic JSX usage
 * (`<AppLayout.Header>...</AppLayout.Header>`).
 */
/* eslint-disable @typescript-eslint/naming-convention */
export const Header: React.FC<{ children?: React.ReactNode }> = ({ children }) =>
  children as React.ReactNode;
export const Sidebar: React.FC<{ children?: React.ReactNode }> = ({ children }) =>
  children as React.ReactNode;
export const Content: React.FC<{ children?: React.ReactNode }> = ({ children }) =>
  children as React.ReactNode;
export const Footer: React.FC<{ children?: React.ReactNode }> = ({ children }) =>
  children as React.ReactNode;
/* eslint-enable @typescript-eslint/naming-convention */