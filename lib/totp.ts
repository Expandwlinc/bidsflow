import "server-only";
import * as OTPAuth from "otpauth";
import QRCode from "qrcode";

const ISSUER = "BidsFlow";

export function generateTotpSecret(): string {
  return new OTPAuth.Secret({ size: 20 }).base32;
}

function buildTotp(secretBase32: string, label: string) {
  return new OTPAuth.TOTP({
    issuer: ISSUER,
    label,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secretBase32),
  });
}

export function verifyTotpCode(secretBase32: string, label: string, code: string): boolean {
  const totp = buildTotp(secretBase32, label);
  // window: 1 tolera un desfase de +/- 30s entre el reloj del dispositivo y el servidor.
  const delta = totp.validate({ token: code.trim(), window: 1 });
  return delta !== null;
}

export async function buildEnrollment(secretBase32: string, label: string) {
  const totp = buildTotp(secretBase32, label);
  const otpauthUrl = totp.toString();
  const qrDataUrl = await QRCode.toDataURL(otpauthUrl);
  return { otpauthUrl, qrDataUrl };
}
