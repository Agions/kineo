'use client';

import * as React from 'react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

// ============================================================
// Popconfirm component
// ============================================================
interface PopconfirmProps {
  children?: React.ReactNode;
  title?: React.ReactNode;
  onConfirm?: () => void;
  okText?: string;
  cancelText?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

function Popconfirm({
  children,
  title,
  onConfirm,
  okText = '确定',
  cancelText = '取消',
  disabled,
}: PopconfirmProps) {
  const [open, setOpen] = React.useState(false);
  return (
    <span>
      <span onClick={() => !disabled && setOpen(true)}>{children}</span>
      {open && (
        <Dialog
          open={open}
          onOpenChange={(o) => {
            setOpen(o);
          }}
        >
          <DialogContent>
            {title && (
              <DialogHeader>
                <DialogTitle>{title}</DialogTitle>
              </DialogHeader>
            )}
            <DialogFooter>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="px-4 py-2 text-sm border rounded-md hover:bg-accent"
              >
                {cancelText}
              </button>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  onConfirm?.();
                }}
                className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                {okText}
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </span>
  );
}

export { Popconfirm, type PopconfirmProps };
