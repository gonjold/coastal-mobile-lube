import QRCodeStyling, { type Options } from "qr-code-styling";
import { COASTAL_LOGO_URL } from "./coastal-logo";
import { DEFAULT_QR_STYLE, type QRStyleConfig } from "./types";

export interface GenerateQROptions {
  url: string;
  logoUrl?: string;
  size?: number;
  style?: QRStyleConfig;
}

export interface GenerateQRResult {
  png: Blob;
  svg: string;
}

function buildQR(opts: GenerateQROptions): QRCodeStyling {
  const size = opts.size ?? 1200;
  const style = opts.style ?? DEFAULT_QR_STYLE;
  const image = style.showLogo ? (opts.logoUrl ?? COASTAL_LOGO_URL) : undefined;

  const config: Options = {
    width: size,
    height: size,
    type: "svg",
    data: opts.url,
    qrOptions: { errorCorrectionLevel: "H" },
    dotsOptions: { color: style.dotColor, type: style.dotStyle },
    backgroundOptions: { color: style.backgroundColor },
    cornersSquareOptions: { color: style.cornerColor, type: "extra-rounded" },
    cornersDotOptions: { color: style.cornerColor, type: "dot" },
  };

  if (image) {
    config.image = image;
    config.imageOptions = {
      crossOrigin: "anonymous",
      imageSize: 0.22,
      margin: 4,
      hideBackgroundDots: true,
    };
  }

  return new QRCodeStyling(config);
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
