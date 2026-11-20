import "server-only";
import QRCode from "qrcode";
import { absoluteUrl } from "@/lib/site";

/** QR code (SVG markup) for a public profile, tagged so scans count as QR visits. */
export function profileQrSvg(username: string) {
  return QRCode.toString(`${absoluteUrl(`/${username}`)}?s=qr`, { type: "svg", margin: 1, width: 160 });
}
