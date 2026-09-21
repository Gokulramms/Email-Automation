import sanitizeHtml from "sanitize-html";

export function sanitizeEmailHtml(htmlContent?: string | null): string {
  if (!htmlContent) return "";

  return sanitizeHtml(htmlContent, {
    allowedTags: [
      "h1", "h2", "h3", "h4", "h5", "h6",
      "blockquote", "p", "a", "ul", "ol", "nl", "li",
      "b", "i", "strong", "em", "strike", "code", "hr",
      "br", "div", "span", "table", "thead", "caption",
      "tbody", "tr", "th", "td", "pre", "img", "font", "style"
    ],
    allowedAttributes: {
      a: ["href", "name", "target", "rel", "title"],
      img: ["src", "alt", "title", "width", "height", "style"],
      div: ["style", "class"],
      span: ["style", "class"],
      p: ["style", "class"],
      table: ["border", "cellpadding", "cellspacing", "style", "width"],
      td: ["colspan", "rowspan", "style", "width", "align", "valign"],
      th: ["colspan", "rowspan", "style", "width", "align", "valign"],
      tr: ["style"],
      font: ["color", "size", "face"],
      style: []
    },
    allowedSchemes: ["http", "https", "mailto", "cid", "data"],
    allowedSchemesAppliedToAttributes: ["href", "src"],
    allowVulnerableTags: true,
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", { target: "_blank", rel: "noopener noreferrer" }),
    },
  });
}

/**
 * Converts plain text into clean, beautifully formatted HTML paragraphs with line breaks.
 */
export function formatBodyToHtml(text: string): string {
  if (!text) return "";
  if (text.includes("<p>") || text.includes("<br")) {
    return sanitizeEmailHtml(text);
  }

  const formattedHtml = text
    .trim()
    .split(/\n\s*\n/)
    .map((paragraph) => {
      const cleanPara = paragraph.replace(/\n/g, "<br/>");
      return `<p style="margin: 0 0 16px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #1e293b;">${cleanPara}</p>`;
    })
    .join("");

  return sanitizeEmailHtml(formattedHtml);
}
