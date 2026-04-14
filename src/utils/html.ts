export function stripHtmlTags(html: string): string {
  // Quran.com API returns HTML in some fields (translations, tafsir).
  // This is a minimal, safe default for plain-text rendering.
  return (
    html
      // Remove tags
      .replace(/<[^>]*>/g, " ")
      // Decode common entities
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      // Collapse whitespace
      .replace(/\s+/g, " ")
      .trim()
  );
}

