/**
 * Geist SemiBold/Bold for share images (the built-in font only has Regular, so
 * titles came out thin). Fetched once per server instance from Google Fonts;
 * if that fails the images still render with the default font.
 */
type OgFont = { name: string; data: ArrayBuffer; weight: 600 | 700; style: "normal" };

let fonts: Promise<OgFont[]> | null = null;

async function load(weight: 600 | 700): Promise<OgFont> {
  const css = await (await fetch(`https://fonts.googleapis.com/css2?family=Geist:wght@${weight}`)).text();
  const url = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/)?.[1];
  if (!url) throw new Error("font url");
  const res = await fetch(url);
  if (!res.ok) throw new Error(`font ${res.status}`);
  return { name: "Geist", data: await res.arrayBuffer(), weight, style: "normal" };
}

export function ogFonts(): Promise<OgFont[]> {
  fonts ??= Promise.all([load(600), load(700)]).catch(() => {
    fonts = null; // try again next time
    return [];
  });
  return fonts;
}
