import baseToast, { type ToastOptions } from 'react-hot-toast';

type ToastMessage = Parameters<typeof baseToast>[0];
type CustomToastHandler = (message: ToastMessage, opts?: ToastOptions) => string;

export type CustomToast = typeof baseToast & {
  info: CustomToastHandler;
  warning: CustomToastHandler;
};

const toast = baseToast as CustomToast;

if (typeof (toast as any).info !== 'function') {
  toast.info = (message: ToastMessage, opts?: ToastOptions) =>
    baseToast(message, {
      icon: 'ℹ️',
      ...opts,
    });
}

if (typeof (toast as any).warning !== 'function') {
  toast.warning = (message: ToastMessage, opts?: ToastOptions) =>
    baseToast(message, {
      icon: '⚠️',
      ...opts,
    });
}

export { toast };
export { Toaster } from 'react-hot-toast';
export default toast;

