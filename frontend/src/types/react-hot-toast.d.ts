declare module 'react-hot-toast' {
  interface ToastOptions { duration?: number; style?: React.CSSProperties; }
  interface ToasterProps { position?: string; reverseOrder?: boolean; toastOptions?: ToastOptions; }
  const Toaster: React.FC<ToasterProps>;
  const toast: {
    (message: string, options?: ToastOptions): string;
    success: (message: string, options?: ToastOptions) => string;
    error: (message: string, options?: ToastOptions) => string;
  };
  export { Toaster, toast };
  export default toast;
}
