'use client';

import * as React from 'react';

import { toast } from '@/components/ui/toast';

// ============================================================
// message API (wraps sonner toast)
// ============================================================
const message = {
  success: (content: React.ReactNode) => toast.success(String(content)),
  error: (content: React.ReactNode) => toast.error(String(content)),
  warning: (content: React.ReactNode) => toast.warning(String(content)),
  info: (content: React.ReactNode) => toast.info(String(content)),
  loading: (content: React.ReactNode) => toast.loading(String(content)),
};

export { message };
