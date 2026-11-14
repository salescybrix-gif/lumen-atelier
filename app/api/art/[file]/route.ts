import { renderArt } from "@/lib/art";

export async function GET(_req: Request, { params }: { params: { file: string } }) {
  const m = params.file.match(/^([a-z]+)-([0-9a-f]{3,6})-(\d)\.svg$/i);
  const svg = m ? renderArt(m[1].toLowerCase(), m[2], Number(m[3])) : renderArt("objects", "8a7f72", 0);
  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
