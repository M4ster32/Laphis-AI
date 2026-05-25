/**
 * Helpers partilhados para exportação de PDF (jsPDF).
 *
 * Objetivos:
 *  - Cores alinhadas com o design do site (paleta charcoal/creme), NÃO o
 *    castanho antigo.
 *  - ZERO emojis: o jsPDF (fonte helvetica) não os suporta e saem como
 *    quadrados/lixo. Toda a string dinâmica deve passar por stripEmojis().
 */

// Paleta — espelha as variáveis do tema "light" em index.css.
// (PDF é sempre sobre papel branco, por isso usamos o tema claro.)
export const PDF = {
  charcoal: [28, 28, 30],   // --primary  (#1C1C1E)
  ink: [26, 26, 28],        // --text     (#1A1A1C)
  body: [58, 58, 60],       // --text-secondary aprox. (#3A3A3C)
  muted: [142, 142, 147],   // --text-muted (#8E8E93)
  divider: [232, 228, 223], // --p5 (#E8E4DF)
  white: [255, 255, 255],
};

/**
 * Remove TODOS os emojis / pictogramas de uma string e normaliza espaços.
 * Cobre: Extended_Pictographic (a esmagadora maioria dos emojis), bandeiras
 * (regional indicators), seletores de variação (FE0F) e zero-width joiner.
 *
 * @param {*} str
 * @returns {string}
 */
export function stripEmojis(str) {
  return String(str ?? "")
    .replace(/\p{Extended_Pictographic}/gu, "")
    .replace(/[\u{1F1E6}-\u{1F1FF}\u{FE00}-\u{FE0F}\u{200D}\u{20E3}]/gu, "")
    // limpar espaços a dobrar e espaço antes de pontuação deixado pelo emoji
    .replace(/\s+([.,;:!?）)])/g, "$1")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/**
 * Desenha a barra de cabeçalho padrão (charcoal + "LAPHIS" + subtítulo + datas).
 * Devolve o `y` a partir do qual o conteúdo deve continuar.
 *
 * @param {import("jspdf").jsPDF} doc
 * @param {Object} [opts]
 * @param {string} [opts.subtitle]    - texto pequeno por baixo de "LAPHIS"
 * @param {string} [opts.rightTop]    - texto alinhado à direita, linha de cima
 * @param {string} [opts.rightBottom] - texto alinhado à direita, linha de baixo
 * @returns {number} y inicial para o corpo
 */
export function pdfHeader(doc, { subtitle = "", rightTop = "", rightBottom = "" } = {}) {
  const W = doc.internal.pageSize.getWidth();
  const m = 16;

  doc.setFillColor(...PDF.charcoal);
  doc.rect(0, 0, W, 38, "F");

  doc.setTextColor(...PDF.white);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("LAPHIS", m, 18);

  if (subtitle) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(stripEmojis(subtitle), m, 28);
  }
  if (rightTop) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(stripEmojis(rightTop), W - m, 18, { align: "right" });
  }
  if (rightBottom) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(stripEmojis(rightBottom), W - m, 28, { align: "right" });
  }

  doc.setTextColor(...PDF.body);
  return 48;
}

/**
 * Escreve o rodapé (em todas as páginas) com a assinatura LAPHIS e numeração.
 * @param {import("jspdf").jsPDF} doc
 * @param {string} [signature]
 */
export function pdfFooter(doc, signature = "Gerado por LAPHIS — o teu assistente de saúde inteligente") {
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const m = 16;
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...PDF.muted);
    doc.text(stripEmojis(signature), m, H - 10);
    doc.text(`${i}/${pageCount}`, W - m, H - 10, { align: "right" });
  }
}
