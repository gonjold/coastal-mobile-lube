import QRCodeStyling from "qr-code-styling";
import { COASTAL_LOGO_URL } from "./coastal-logo";

export interface GenerateQROptions {
  url: string;
  logoUrl?: string;
  size?: number;
}

export interface GenerateQRResult {
  png: Blob;
  svg: string;
}

function buildQR(opts: GenerateQROptions): QRCodeStyling {
  const size = opts.size ?? 1200;
  return new QRCodeStyling({
    width: size,
    height: size,
    type: "svg",
    data: opts.url,
    image: opts.logoUrl ?? COASTAL_LOGO_URL,
    qrOptions: { errorCorrectionLevel: "H" },
    dotsOptions: { color: "#0B2040", type: "rounded" },
    backgroundOptions: { color: "#FFFFFF" },
    cornersSquareOptions: { color: "#E07B2D", type: "extra-rounded" },
    cornersDotOptions: { color: "#E07B2D", type: "dot" },
    imageOptions: {
      crossOrigin: "anonymous",
      imageSize: 0.22,
      margin: 4,
      hideBackgroundDots: true,
    },
  });
}

export async function generateQR(
  opts: GenerateQROptions,
): Promise<GenerateQRResult> {
  const qr = buildQR(opts);

  const pngRaw = await qr.getRawData("png");
  if (!pngRaw) throw new Error("Failed to generate QR PNG");
  const png =
    pngRaw instanceof Blob
      ? pngRaw
      : new Blob([pngRaw as unknown as BlobPart], { type: "image/png" });

  const svgRaw = await qr.getRawData("svg");
  if (!svgRaw) throw new Error("Failed to generate QR SVG");
  const svg =
    svgRaw instanceof Blob
      ? await svgRaw.text()
      : typeof svgRaw === "string"
        ? svgRaw
        : new TextDecoder().decode(svgRaw as unknown as ArrayBuffer);

  return { png, svg };
}

export function buildQRForPreview(opts: GenerateQROptions): QRCodeStyling {
  return buildQR(opts);
}
