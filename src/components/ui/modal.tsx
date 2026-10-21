'use client';

import * as React from 'react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/common/utils/class-names';

// ============================================================
// AntD-compatible Modal (wraps shadcn Dialog)
// ============================================================
interface ModalProps {
  open?: boolean;
  onCancel?: () => void;
  onOk?: () => void;
  title?: React.ReactNode;
  footer?: React.ReactNode;
  width?: number | string;
  children?: React.ReactNode;
  className?: string;
  maskClosable?: boolean;
  closable?: boolean;
  destroyOnClose?: boolean;
  okText?: React.ReactNode;
  cancelText?: React.ReactNode;
}

const ModalFn = ({
  open,
  onCancel,
  onOk,
  title,
  footer,
  width = 520,
  children,
  className,
  maskClosable = true,
  closable = true,
  okText,
  cancelText,
}: ModalProps) => {
  const [isOpen, setIsOpen] = React.useState(open ?? false);
  const prevOpenRef = React.useRef<boolean | undefined>(open);
  React.useEffect(() => {
    if (open !== undefined && open !== prevOpenRef.current) {
      prevOpenRef.current = open;
      setIsOpen(open);
    }
  }, [open]);

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      onCancel?.();
    }
    setIsOpen(newOpen);
  };

  const handleCancel = () => {
    onCancel?.();
    setIsOpen(false);
  };

  const handleOk = () => {
    onOk?.();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        className={className}
        style={{ maxWidth: typeof width === 'number' ? width : width }}
        onPointerDownOutside={(e) => {
          if (!maskClosable) e.preventDefault();
        }}
      >
        {closable && <DialogHeader>{title && <DialogTitle>{title}</DialogTitle>}</DialogHeader>}
        {title && !closable && (
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
        )}
        <div className="py-2">{children}</div>
        {footer && <div className="flex justify-end gap-2 mt-4">{footer}</div>}
        {footer === undefined && (onOk || okText) && (
          <DialogFooter>
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 text-sm border rounded-md hover:bg-accent"
            >
              {cancelText ?? '取消'}
            </button>
            <button
              type="button"
              onClick={handleOk}
              className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              {okText ?? '确定'}
            </button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};

/**
 * 通用 Modal 内部包装 — 渲染 Dialog + DialogContent + Header + content + Footer。
 * 内部 helper — 消除 ModalConfirm 与 ModalConfirmDialog 之间 26L 重复结构。
 */
function ModalShell({
  open,
  onOpenChange,
  title,
  content,
  cancelText,
  onCancel,
  okText,
  onOk,
  okClassName,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title?: React.ReactNode;
  content?: React.ReactNode;
  cancelText: React.ReactNode;
  onCancel: () => void;
  okText: React.ReactNode;
  onOk: () => void;
  okClassName: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {title && (
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
        )}
        {content && <div className="py-2">{content}</div>}
        <DialogFooter>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm border rounded-md hover:bg-accent"
          >
            {cancelText}
          </button>
          <button type="button" onClick={onOk} className={okClassName}>
            {okText}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Modal.confirm helper - functional call pattern (AntD style)
const ModalConfirm = ({
  title,
  content,
  onOk,
  onCancel,
}: {
  title?: React.ReactNode;
  content?: React.ReactNode;
  onOk?: () => void;
  onCancel?: () => void;
}) => {
  const [open, setOpen] = React.useState(true);
  const openRef = React.useRef(open);
  const onCancelRef = React.useRef(onCancel);

  React.useEffect(() => {
    openRef.current = open;
    onCancelRef.current = onCancel;
  });

  // Cleanup: call onCancel if dialog unmounts while still open
  React.useEffect(() => {
    return () => {
      if (openRef.current) onCancelRef.current?.();
    };
  }, []);

  return (
    <ModalShell
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) onCancel?.();
      }}
      title={title}
      content={content}
      cancelText="取消"
      onCancel={() => {
        setOpen(false);
        onCancel?.();
      }}
      okText="确定"
      onOk={() => {
        setOpen(false);
        onOk?.();
      }}
      okClassName="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
    />
  );
};

const ModalConfirmDialog = ({
  title,
  content,
  onOk,
  onCancel,
  okText = '确定',
  cancelText = '取消',
  okType,
}: {
  title?: React.ReactNode;
  content?: React.ReactNode;
  onOk?: () => void;
  onCancel?: () => void;
  okText?: React.ReactNode;
  cancelText?: React.ReactNode;
  okType?: string;
}) => {
  const [open, setOpen] = React.useState(true);
  const openRef = React.useRef(open);
  const onCancelRef = React.useRef(onCancel);

  React.useEffect(() => {
    openRef.current = open;
    onCancelRef.current = onCancel;
  });

  // Cleanup: call onCancel if dialog unmounts while still open
  React.useEffect(() => {
    return () => {
      if (openRef.current) onCancelRef.current?.();
    };
  }, []);

  const okClass =
    okType === 'danger'
      ? 'bg-red-500 text-white hover:bg-red-600'
      : 'bg-primary text-primary-foreground hover:bg-primary/90';
  return (
    <ModalShell
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) onCancel?.();
      }}
      title={title}
      content={content}
      cancelText={cancelText}
      onCancel={() => {
        setOpen(false);
        onCancel?.();
      }}
      okText={okText}
      onOk={() => {
        setOpen(false);
        onOk?.();
      }}
      okClassName={cn('px-4 py-2 text-sm rounded-md hover:bg-primary/90', okClass)}
    />
  );
};

type BaseConfirmProps = {
  title?: React.ReactNode;
  content?: React.ReactNode;
  onOk?: () => void;
  onCancel?: () => void;
};

type ConfirmProps = BaseConfirmProps & {
  okText?: React.ReactNode;
  cancelText?: React.ReactNode;
  okType?: string;
};

type ModalType = {
  (props: ModalProps): React.ReactElement;
  confirm: (props: ConfirmProps) => React.ReactElement;
  confirmAlt: (props: BaseConfirmProps) => React.ReactElement;
};
const Modal = Object.assign(ModalFn as unknown as ModalType, {
  confirm: (props: ConfirmProps) => React.createElement(ModalConfirmDialog, props),
  confirmAlt: ModalConfirm,
});

export { Modal, ModalConfirmDialog, ModalConfirm, type ModalProps };
