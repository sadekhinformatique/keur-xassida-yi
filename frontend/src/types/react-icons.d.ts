declare module 'react-icons/hi' {
  import { FC, SVGProps } from 'react';
  export const HiOutlineHome: FC<SVGProps<SVGSVGElement>>;
  export const HiOutlineUserGroup: FC<SVGProps<SVGSVGElement>>;
  export const HiOutlineClock: FC<SVGProps<SVGSVGElement>>;
  export const HiOutlineQrcode: FC<SVGProps<SVGSVGElement>>;
  export const HiOutlineClipboardCheck: FC<SVGProps<SVGSVGElement>>;
  export const HiOutlineDocumentReport: FC<SVGProps<SVGSVGElement>>;
  export const HiOutlineCog: FC<SVGProps<SVGSVGElement>>;
  export const HiOutlineLogout: FC<SVGProps<SVGSVGElement>>;
  export const HiOutlineX: FC<SVGProps<SVGSVGElement>>;
  export const HiOutlineMenu: FC<SVGProps<SVGSVGElement>>;
  export const HiOutlineBell: FC<SVGProps<SVGSVGElement>>;
  export const HiOutlineEye: FC<SVGProps<SVGSVGElement>>;
  export const HiOutlineEyeOff: FC<SVGProps<SVGSVGElement>>;
  export const HiOutlinePlus: FC<SVGProps<SVGSVGElement>>;
  export const HiOutlinePencil: FC<SVGProps<SVGSVGElement>>;
  export const HiOutlineTrash: FC<SVGProps<SVGSVGElement>>;
  export const HiOutlineSearch: FC<SVGProps<SVGSVGElement>>;
  export const HiOutlineArrowLeft: FC<SVGProps<SVGSVGElement>>;
  export const HiOutlineCheckCircle: FC<SVGProps<SVGSVGElement>>;
  export const HiOutlineXCircle: FC<SVGProps<SVGSVGElement>>;
  export const HiOutlineArrowRight: FC<SVGProps<SVGSVGElement>>;
  export const HiOutlineDownload: FC<SVGProps<SVGSVGElement>>;
  export const HiOutlineRefresh: FC<SVGProps<SVGSVGElement>>;
  export const HiOutlinePrinter: FC<SVGProps<SVGSVGElement>>;
  export const HiOutlineArrowsExpand: FC<SVGProps<SVGSVGElement>>;
}

declare module 'file-saver' {
  export function saveAs(data: Blob, filename: string): void;
}

declare module 'qrcode' {
  interface QRCodeOptions { width?: number; margin?: number; color?: { dark: string; light: string; }; }
  const QRCode: { toCanvas: (canvas: HTMLCanvasElement, text: string, options?: QRCodeOptions) => Promise<void>; };
  export default QRCode;
}
