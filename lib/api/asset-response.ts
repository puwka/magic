export const binaryResponse = (params: {
  data: Buffer;
  contentType: string;
  filename?: string;
  disposition?: "inline" | "attachment";
}) => {
  const bytes = new Uint8Array(params.data);
  const headers = new Headers({
    "Content-Type": params.contentType,
    "Content-Length": String(bytes.byteLength),
    "Cache-Control": "private, no-store, max-age=0",
    Pragma: "no-cache",
    "X-Content-Type-Options": "nosniff",
  });

  if (params.filename) {
    const ascii = params.filename.replace(/[^\x20-\x7E]+/g, "_").replace(/["\\]/g, "_");
    headers.set(
      "Content-Disposition",
      (params.disposition ?? "inline") +
        "; filename=\"" +
        ascii +
        "\"; filename*=UTF-8''" +
        encodeURIComponent(params.filename),
    );
  }

  return new Response(bytes, { status: 200, headers });
};
