import { renderSVG } from "uqr";

/** Local QR SVG. No network. Encodes the public report URL. */
export function qrSvg(value: string): string {
  return renderSVG(value, {
    ecc: "M",
    border: 2,
    pixelSize: 4,
    whiteColor: "#fffdf8",
    blackColor: "#0c3324",
  });
}
