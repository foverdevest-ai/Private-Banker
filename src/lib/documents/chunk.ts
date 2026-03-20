export type ChunkResult = {
  chunkIndex: number;
  page: number | null;
  content: string;
  tokenCount: number;
};

export function splitIntoChunks(text: string, maxChars = 1200): ChunkResult[] {
  const normalized = text.replace(/\r/g, "").trim();
  if (!normalized) {
    return [];
  }

  const paragraphs = normalized.split(/\n{2,}/).map((line) => line.trim());
  const chunks: ChunkResult[] = [];
  let current = "";
  let index = 0;

  for (const paragraph of paragraphs) {
    if (!paragraph) {
      continue;
    }

    if ((current + "\n\n" + paragraph).length > maxChars && current.length > 0) {
      chunks.push({
        chunkIndex: index,
        page: null,
        content: current,
        tokenCount: Math.ceil(current.length / 4),
      });
      index += 1;
      current = paragraph;
    } else {
      current = current ? `${current}\n\n${paragraph}` : paragraph;
    }
  }

  if (current) {
    chunks.push({
      chunkIndex: index,
      page: null,
      content: current,
      tokenCount: Math.ceil(current.length / 4),
    });
  }

  return chunks;
}
