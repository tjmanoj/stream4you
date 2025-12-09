export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    if (!id) return new Response('Missing id', { status: 400 });

    // Forward Range header if present
    const range = req.headers.get('range') || undefined;

    // Use Drive API alt=media to stream file bytes. File must be shared "Anyone with the link".
    const driveUrl = `https://www.googleapis.com/drive/v3/files/${id}?alt=media&key=${process.env.GOOGLE_API_KEY}`;

    const res = await fetch(driveUrl, {
      headers: range ? { Range: range } : undefined,
    });

    // Build response headers for the client. We forward content-range if present.
    const headers = new Headers();
    const contentType = res.headers.get('content-type') || 'video/mp4';
    headers.set('Content-Type', contentType);
    headers.set('Accept-Ranges', 'bytes');
    const contentRange = res.headers.get('content-range');
    const contentLength = res.headers.get('content-length');
    if (contentRange) headers.set('Content-Range', contentRange);
    if (contentLength) headers.set('Content-Length', contentLength);

    return new Response(res.body, {
      status: res.status,
      headers,
    });
  } catch (err) {
    return new Response('Error: ' + String(err), { status: 500 });
  }
}
