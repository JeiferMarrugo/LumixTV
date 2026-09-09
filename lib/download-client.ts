export async function triggerContentDownload(
  contentId: string,
  params: { season?: number; episode?: number; type?: string },
): Promise<{ filename: string }> {
  const query = new URLSearchParams({
    season: String(params.season ?? 1),
    episode: String(params.episode ?? 1),
  });
  if (params.type) query.set("type", params.type);

  const res = await fetch(
    `/api/content/${encodeURIComponent(contentId)}/download?${query}`,
  );

  const data = (await res.json()) as {
    available?: boolean;
    fileUrl?: string;
    filename?: string;
    error?: string;
  };

  if (!res.ok || !data.available || !data.fileUrl) {
    throw new Error(data.error ?? "No se pudo preparar la descarga");
  }

  const filename = data.filename ?? "descarga.mp4";
  const fileUrl = data.fileUrl;

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

  return { filename };
}
