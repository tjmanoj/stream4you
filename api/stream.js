export const config = { runtime: "edge" };

export default async function handler(req) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) return new Response("Missing id", { status: 400 });

    const range = req.headers.get("range") || undefined;

    // Direct download URL for public files
    const driveUrl = `https://drive.google.com/uc?export=download&id=${id}`;

    const res = await fetch(driveUrl, {
      headers: range ? { Range: range } : undefined,
    });

    if (!res.ok) return new Response("File not found", { status: res.status });

    const headers = new Headers();
    headers.set("Content-Type", "video/mp4");
    headers.set("Accept-Ranges", "bytes");
    const contentLength = res.headers.get("content-length");
    if (contentLength) headers.set("Content-Length", contentLength);

    return new Response(res.body, { status: 200, headers });
  } catch (err) {
    return new Response("Error: " + String(err), { status: 500 });
  }
}
