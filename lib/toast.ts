import toast from 'react-hot-toast';

if (typeof (toast as any).info !== 'function') {
  (toast as any).info = (message: any, opts?: any) =>
    toast(message, {
      icon: 'ℹ️',
      ...opts,
    });
}

if (typeof (toast as any).warning !== 'function') {
  (toast as any).warning = (message: any, opts?: any) =>
    toast(message, {
      icon: '⚠️',
      ...opts,
    });
}

export { toast };
export { Toaster } from 'react-hot-toast';
export default toast;
