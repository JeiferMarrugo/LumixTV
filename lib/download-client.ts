export interface DownloadJobResult {
  id: string;
  filename: string;
  fileUrl: string;
}

function triggerBrowserDownload(fileUrl: string, filename: string) {
  const iframe = document.createElement("iframe");
  iframe.style.display = "none";
  iframe.src = fileUrl;
  document.body.appendChild(iframe);
  window.setTimeout(() => iframe.remove(), 120_000);

  const link = document.createElement("a");
  link.href = fileUrl;
  link.download = filename;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export async function triggerContentDownload(
  contentId: string,
  params: { season?: number; episode?: number; type?: string },
): Promise<DownloadJobResult> {
  const res = await fetch("/api/downloads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contentId,
      season: params.season,
      episode: params.episode,
      type: params.type,
    }),
  });

  const data = (await res.json()) as {
    available?: boolean;
    fileUrl?: string;
    filename?: string;
    item?: { id: string };
    error?: string;
  };

  if (!res.ok || !data.available || !data.fileUrl || !data.filename || !data.item?.id) {
    throw new Error(data.error ?? "No se pudo preparar la descarga");
  }

  triggerBrowserDownload(data.fileUrl, data.filename);

  return {
    id: data.item.id,
    filename: data.filename,
    fileUrl: data.fileUrl,
  };
}

export function retryDownloadFromRecord(fileUrl: string, filename: string) {
  triggerBrowserDownload(fileUrl, filename);
}
