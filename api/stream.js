export const config = { runtime: "edge" };

export default async function handler(req) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) return new Response("Missing id", { status: 400 });

    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return new Response("GOOGLE_API_KEY not configured", { status: 500 });
    }

    const range = req.headers.get("range") || undefined;

    // First, get file metadata using Google Drive API
    // Use fields parameter to get only what we need
    const metadataUrl = `https://www.googleapis.com/drive/v3/files/${id}?fields=id,name,mimeType,size&key=${apiKey}`;
    const metadataRes = await fetch(metadataUrl);
    
    if (!metadataRes.ok) {
      const errorText = await metadataRes.text();
      return new Response(`File not found: ${errorText}`, { status: metadataRes.status });
    }

    const metadata = await metadataRes.json();
    
    // Get download URL for the file
    // For large files, we need to use the alt=media endpoint
    const downloadUrl = `https://www.googleapis.com/drive/v3/files/${id}?alt=media&key=${apiKey}`;

    // Prepare headers for the download request
    const downloadHeaders = {};
    if (range) {
      downloadHeaders["Range"] = range;
    }

    const res = await fetch(downloadUrl, {
      headers: downloadHeaders,
    });

    if (!res.ok) {
      const errorText = await res.text();
      return new Response(`Download failed: ${errorText}`, { status: res.status });
    }

    // Set response headers
    const headers = new Headers();
    
    // Determine content type from metadata or response
    const mimeType = metadata.mimeType || res.headers.get("content-type") || "video/mp4";
    headers.set("Content-Type", mimeType);
    headers.set("Accept-Ranges", "bytes");
    
    // Handle content length
    const contentLength = res.headers.get("content-length");
    if (contentLength) {
      headers.set("Content-Length", contentLength);
    }
    
    // Handle range responses
    if (range && res.status === 206) {
      headers.set("Content-Range", res.headers.get("content-range") || "");
      return new Response(res.body, { status: 206, headers });
    }

    return new Response(res.body, { status: 200, headers });
  } catch (err) {
    return new Response("Error: " + String(err), { status: 500 });
  }
}
