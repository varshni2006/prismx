import QRCode from 'qrcode';

export async function makeQrDataUrl(text: string): Promise<string> {
  return QRCode.toDataURL(text, {
    margin: 1,
    width: 240,
    color: { dark: '#1f2330', light: '#ffffff' },
    errorCorrectionLevel: 'M',
  });
}
