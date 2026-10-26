import path from "node:path";
import PDFDocument from "pdfkit";
import sharp from "sharp";
import type { GeneratedIllustration, StoryBook } from "@/lib/generation/types";
import type { Order } from "@/lib/orders/types";
import { plural } from "@/lib/format";

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 50;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

const COLORS = {
  ink: "#172038",
  muted: "#667087",
  blue: "#263cc4",
  deep: "#172a87",
  coral: "#f4654e",
  gold: "#ffd86b",
  paper: "#fffdf7",
  cream: "#f7f1e3",
  line: "#ddd6c4",
  white: "#ffffff",
};

const FONT_DIR = path.join(process.cwd(), "public", "fonts");

type PdfImage = {
  data: Buffer;
  width: number;
  height: number;
};

export type BookPdfInput = {
  order: Order;
  story: StoryBook;
  cover: GeneratedIllustration;
  coverData: Buffer;
  illustrations: Array<GeneratedIllustration & { data: Buffer }>;
};

type PdfDoc = PDFKit.PDFDocument;

const registerFonts = (doc: PdfDoc) => {
  doc.registerFont("Serif", path.join(FONT_DIR, "PTSerif-Regular.ttf"));
  doc.registerFont("Serif-Bold", path.join(FONT_DIR, "PTSerif-Bold.ttf"));
  doc.registerFont("Serif-Italic", path.join(FONT_DIR, "PTSerif-Italic.ttf"));
  doc.registerFont("Sans", path.join(FONT_DIR, "PTSans-Regular.ttf"));
  doc.registerFont("Sans-Bold", path.join(FONT_DIR, "PTSans-Bold.ttf"));
  doc.registerFont("Sans-Italic", path.join(FONT_DIR, "PTSans-Italic.ttf"));
};

const imageFrom = async (data: Buffer): Promise<PdfImage> => {
  const meta = await sharp(data).metadata();
  return {
    data,
    width: meta.width ?? 1600,
    height: meta.height ?? 1100,
  };
};

const drawPageBackground = (doc: PdfDoc, color = COLORS.paper) => {
  doc.save();
  doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT).fill(color);
  doc.restore();
};

const drawContainedImage = (doc: PdfDoc, image: PdfImage, x: number, y: number, maxWidth: number, maxHeight: number) => {
  const ratio = Math.min(maxWidth / image.width, maxHeight / image.height);
  const width = image.width * ratio;
  const height = image.height * ratio;
  const left = x + (maxWidth - width) / 2;
  const top = y + (maxHeight - height) / 2;
  doc.image(image.data, left, top, { width, height });
  return { width, height, left, top };
};

const drawStar = (doc: PdfDoc, x: number, y: number, radius: number, color: string) => {
  doc.save();
  doc.fillColor(color);
  doc.moveTo(x, y - radius);
  doc.lineTo(x + radius * 0.24, y - radius * 0.24);
  doc.lineTo(x + radius, y);
  doc.lineTo(x + radius * 0.24, y + radius * 0.24);
  doc.lineTo(x, y + radius);
  doc.lineTo(x - radius * 0.24, y + radius * 0.24);
  doc.lineTo(x - radius, y);
  doc.lineTo(x - radius * 0.24, y - radius * 0.24);
  doc.closePath().fill();
  doc.restore();
};

const drawDemoMark = (doc: PdfDoc) => {
  doc.save();
  doc.roundedRect(PAGE_WIDTH - 118, 18, 78, 18, 4).fill(COLORS.coral);
  doc.font("Sans-Bold").fontSize(7).fillColor(COLORS.white).text("ДЕМО-ВЕРСИЯ", PAGE_WIDTH - 118, 24, {
    width: 78,
    align: "center",
  });
  doc.restore();
};

const drawBookCover = (doc: PdfDoc, input: BookPdfInput, coverImage: PdfImage) => {
  drawPageBackground(doc, COLORS.deep);
  doc.save();
  doc.rect(26, 26, PAGE_WIDTH - 52, PAGE_HEIGHT - 52).lineWidth(1).stroke("#7e8be1");
  doc.rect(33, 33, PAGE_WIDTH - 66, PAGE_HEIGHT - 66).lineWidth(0.5).stroke("#5d6dcb");
  doc.restore();

  doc.font("Sans-Bold").fontSize(8).fillColor("#c8d0ff").text("МАГИЯ · ПЕРСОНАЛЬНАЯ ИСТОРИЯ", 50, 58, {
    width: CONTENT_WIDTH,
    align: "center",
    characterSpacing: 1.6,
  });

  const artX = 55;
  const artY = 92;
  const artW = PAGE_WIDTH - 110;
  const artH = 322;
  doc.save();
  doc.roundedRect(artX - 6, artY - 6, artW + 12, artH + 12, 8).fill("#f7e8c6");
  doc.restore();
  const drawn = drawContainedImage(doc, coverImage, artX, artY, artW, artH);
  doc.save();
  doc.rect(drawn.left, drawn.top, drawn.width, drawn.height).lineWidth(0.8).stroke("#d7bd7e");
  doc.restore();

  const titleSize = input.story.title.length > 58 ? 20 : input.story.title.length > 42 ? 24 : 30;
  doc.font("Serif-Bold").fontSize(titleSize).fillColor("#fff5d8").text(input.story.title, 52, 452, {
    width: PAGE_WIDTH - 104,
    align: "center",
    lineGap: 2,
  });

  const afterTitle = doc.y + 10;
  doc.font("Serif-Italic").fontSize(13).fillColor("#d8ddff").text(input.story.subtitle, 76, afterTitle, {
    width: PAGE_WIDTH - 152,
    align: "center",
    lineGap: 2,
  });

  const lineY = doc.y + 22;
  doc.save();
  doc.moveTo(205, lineY).lineTo(390, lineY).lineWidth(0.8).stroke("#8c9be9");
  doc.restore();
  drawStar(doc, PAGE_WIDTH / 2, lineY, 8, COLORS.gold);

  doc.font("Sans").fontSize(9).fillColor("#aeb9ef").text("ГЕРОЙ ЭТОЙ ИСТОРИИ", 50, lineY + 27, {
    width: CONTENT_WIDTH,
    align: "center",
    characterSpacing: 1.4,
  });

  doc.font("Serif-Bold").fontSize(24).fillColor(COLORS.gold).text(input.order.input.childName, 50, lineY + 45, {
    width: CONTENT_WIDTH,
    align: "center",
  });

  const footerY = PAGE_HEIGHT - 92;
  doc.save();
  doc.moveTo(80, footerY).lineTo(PAGE_WIDTH - 80, footerY).lineWidth(0.6).stroke("#5869bf");
  doc.restore();
  doc.font("Sans").fontSize(8).fillColor("#bdc6f5").text(
    input.story.chapters.length +
      " " +
      plural(input.story.chapters.length, "глава", "главы", "глав") +
      " · " +
      input.illustrations.length +
      " " +
      plural(input.illustrations.length, "иллюстрация", "иллюстрации", "иллюстраций") +
      " · заказ " +
      input.order.orderNumber,
    50,
    footerY + 14,
    { width: CONTENT_WIDTH, align: "center" },
  );
  doc.font("Sans").fontSize(7).fillColor("#8e9bdb").text(
    "Создано сервисом персональных сказок «Магия»",
    50,
    footerY + 30,
    { width: CONTENT_WIDTH, align: "center" },
  );

  if (input.order.isDemo || input.order.result?.isDemo) drawDemoMark(doc);
};

const safeChapterTitle = (title: string) => title.replace(/\s+/g, " ").trim();

const drawChapterPage = (
  doc: PdfDoc,
  input: BookPdfInput,
  chapter: StoryBook["chapters"][number],
  index: number,
  image: PdfImage | null,
  isNewPage: boolean,
) => {
  if (isNewPage) doc.addPage({ size: "A4", margins: { top: 0, bottom: 0, left: 0, right: 0 } });
  drawPageBackground(doc, COLORS.paper);

  doc.save();
  doc.rect(0, 0, PAGE_WIDTH, 8).fill(index % 2 === 0 ? COLORS.blue : COLORS.coral);
  doc.restore();

  doc.font("Sans-Bold").fontSize(7).fillColor(COLORS.blue).text(
    "МАГИЯ · " + input.story.title.toUpperCase(),
    MARGIN,
    35,
    { width: CONTENT_WIDTH - 60, characterSpacing: 1.1, lineBreak: false },
  );
  doc.font("Sans").fontSize(7).fillColor(COLORS.muted).text(
    "ГЛАВА " + (index + 1) + " / " + input.story.chapters.length,
    PAGE_WIDTH - MARGIN - 80,
    35,
    { width: 80, align: "right" },
  );

  doc.font("Serif-Bold").fontSize(24).fillColor(COLORS.ink).text(safeChapterTitle(chapter.title), MARGIN, 68, {
    width: CONTENT_WIDTH,
    lineGap: 2,
  });

  let cursor = doc.y + 16;
  if (image) {
    const maxArtHeight = 286;
    doc.save();
    doc.roundedRect(MARGIN - 4, cursor - 4, CONTENT_WIDTH + 8, maxArtHeight + 8, 6).fill("#f1ead9");
    doc.restore();
    const drawn = drawContainedImage(doc, image, MARGIN, cursor, CONTENT_WIDTH, maxArtHeight);
    doc.save();
    doc.rect(drawn.left, drawn.top, drawn.width, drawn.height).lineWidth(0.6).stroke("#d2c5a8");
    doc.restore();
    cursor += maxArtHeight + 24;
  } else {
    doc.save();
    doc.moveTo(MARGIN, cursor + 5).lineTo(MARGIN + 74, cursor + 5).lineWidth(1).stroke(COLORS.gold);
    drawStar(doc, MARGIN + 88, cursor + 5, 5, COLORS.coral);
    doc.restore();
    cursor += 28;
  }

  const availableHeight = PAGE_HEIGHT - 78 - cursor;
  let fontSize = 12.2;
  let lineGap = 4.7;
  // PDFKit измеряет текст активным шрифтом документа: опции `font`/`fontSize`
  // в heightOfString игнорируются, поэтому задаём их через doc перед замером.
  doc.font("Serif");
  doc.fontSize(fontSize);
  let textHeight = doc.heightOfString(chapter.text, { width: CONTENT_WIDTH, lineGap });

  while (textHeight > availableHeight && fontSize > 9) {
    fontSize -= 0.4;
    lineGap = fontSize < 10.5 ? 3.4 : 4.7;
    doc.fontSize(fontSize);
    textHeight = doc.heightOfString(chapter.text, { width: CONTENT_WIDTH, lineGap });
  }

  if (!image) {
    // Крупный светлый номер заполняет воздух на текстовых разворотах
    // и не спорит с основным текстом.
    doc.save();
    doc.font("Serif-Bold").fontSize(150).fillColor("#f2ecdf").text(
      String(index + 1).padStart(2, "0"),
      PAGE_WIDTH - MARGIN - 180,
      PAGE_HEIGHT - 292,
      { width: 180, align: "right", lineBreak: false },
    );
    doc.restore();
  }

  doc.font("Serif").fontSize(fontSize).fillColor("#29324a").text(chapter.text, MARGIN, cursor, {
    width: CONTENT_WIDTH,
    lineGap,
    align: "left",
  });

  const footerY = PAGE_HEIGHT - 46;
  doc.save();
  doc.moveTo(MARGIN, footerY - 12).lineTo(PAGE_WIDTH - MARGIN, footerY - 12).lineWidth(0.4).stroke(COLORS.line);
  doc.restore();
  doc.font("Sans").fontSize(7).fillColor(COLORS.muted).text(
    input.order.input.childName + " · «Магия»",
    MARGIN,
    footerY,
    { width: CONTENT_WIDTH / 2, lineBreak: false },
  );
  doc.font("Sans").fontSize(7).fillColor(COLORS.muted).text(
    String(index + 2) + " / " + String(input.story.chapters.length + 3),
    PAGE_WIDTH - MARGIN - 70,
    footerY,
    { width: 70, align: "right", lineBreak: false },
  );

  if (input.order.isDemo || input.order.result?.isDemo) drawDemoMark(doc);
};

const drawClosingPage = (doc: PdfDoc, input: BookPdfInput, image: PdfImage | null) => {
  doc.addPage({ size: "A4", margins: { top: 0, bottom: 0, left: 0, right: 0 } });
  drawPageBackground(doc, COLORS.deep);

  doc.save();
  doc.rect(26, 26, PAGE_WIDTH - 52, PAGE_HEIGHT - 52).lineWidth(0.8).stroke("#7e8be1");
  doc.restore();

  if (image) {
    const drawn = drawContainedImage(doc, image, 52, 82, PAGE_WIDTH - 104, 300);
    doc.save();
    doc.rect(drawn.left, drawn.top, drawn.width, drawn.height).lineWidth(0.6).stroke("#d7bd7e");
    doc.restore();
  }

  const contentTop = image ? 420 : 155;
  drawStar(doc, PAGE_WIDTH / 2, contentTop, 10, COLORS.gold);

  doc.font("Serif-Bold").fontSize(38).fillColor("#fff5d8").text("Конец", 50, contentTop + 26, {
    width: CONTENT_WIDTH,
    align: "center",
  });

  doc.font("Serif-Italic").fontSize(16).fillColor("#d8ddff").text(input.story.closingLine, 70, contentTop + 86, {
    width: PAGE_WIDTH - 140,
    align: "center",
    lineGap: 4,
  });

  doc.font("Sans").fontSize(8).fillColor("#bdc6f5").text(
    "Но история остаётся с вами. Переверните страницу — там письмо.",
    50,
    PAGE_HEIGHT - 145,
    { width: CONTENT_WIDTH, align: "center" },
  );

  if (input.order.isDemo || input.order.result?.isDemo) drawDemoMark(doc);
};

const drawLetterPage = (doc: PdfDoc, input: BookPdfInput) => {
  doc.addPage({ size: "A4", margins: { top: 0, bottom: 0, left: 0, right: 0 } });
  drawPageBackground(doc, COLORS.cream);

  doc.save();
  doc.rect(34, 34, PAGE_WIDTH - 68, PAGE_HEIGHT - 68).lineWidth(0.7).stroke("#d9cdb4");
  doc.restore();

  doc.font("Sans-Bold").fontSize(8).fillColor(COLORS.blue).text("ЛИЧНОЕ ПИСЬМО", MARGIN, 62, {
    width: CONTENT_WIDTH,
    align: "center",
    characterSpacing: 1.8,
  });

  doc.font("Serif-Bold").fontSize(28).fillColor(COLORS.ink).text(input.order.input.childName, MARGIN, 84, {
    width: CONTENT_WIDTH,
    align: "center",
  });

  drawStar(doc, PAGE_WIDTH / 2, 132, 7, COLORS.coral);

  const letter = input.story.letter;
  doc.font("Serif");
  let fontSize = 9.9;
  doc.fontSize(fontSize);
  let letterHeight = doc.heightOfString(letter, { width: CONTENT_WIDTH - 22, lineGap: 4 });
  while (fontSize > 8.2 && letterHeight > 288) {
    fontSize -= 0.3;
    doc.fontSize(fontSize);
    letterHeight = doc.heightOfString(letter, { width: CONTENT_WIDTH - 22, lineGap: 4 });
  }

  doc.font("Serif").fontSize(fontSize).fillColor("#3b4052").text(letter, MARGIN + 11, 153, {
    width: CONTENT_WIDTH - 22,
    lineGap: 4,
  });

  const certTop = 500;
  doc.save();
  doc.roundedRect(MARGIN, certTop, CONTENT_WIDTH, 190, 8).fill("#fffaf0");
  doc.roundedRect(MARGIN, certTop, CONTENT_WIDTH, 190, 8).lineWidth(0.9).stroke("#bfa66b");
  doc.restore();

  doc.font("Sans-Bold").fontSize(7).fillColor(COLORS.coral).text("СЕРТИФИКАТ ПЕРСОНАЛЬНОЙ ИСТОРИИ", MARGIN, certTop + 17, {
    width: CONTENT_WIDTH,
    align: "center",
    characterSpacing: 1.6,
  });
  doc.font("Serif-Italic").fontSize(11).fillColor(COLORS.muted).text("Герой этой книги", MARGIN, certTop + 40, {
    width: CONTENT_WIDTH,
    align: "center",
  });
  doc.font("Serif-Bold").fontSize(22).fillColor(COLORS.deep).text(input.order.input.childName, MARGIN, certTop + 57, {
    width: CONTENT_WIDTH,
    align: "center",
  });
  doc.font("Serif").fontSize(9.5).fillColor(COLORS.muted).text(
    "«" + input.story.title + "»",
    MARGIN + 30,
    certTop + 89,
    { width: CONTENT_WIDTH - 60, align: "center" },
  );

  doc.save();
  doc.moveTo(MARGIN + 35, certTop + 124).lineTo(PAGE_WIDTH - MARGIN - 35, certTop + 124).lineWidth(0.5).stroke("#d8c9a5");
  doc.restore();

  const completed = input.order.completedAt ?? new Date().toISOString();
  const date = new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(completed));

  doc.font("Sans").fontSize(7.5).fillColor(COLORS.muted).text(
    "Дата: " + date + "   ·   Заказ: " + input.order.orderNumber + "   ·   " + input.story.chapters.length + " глав",
    MARGIN + 20,
    certTop + 140,
    { width: CONTENT_WIDTH - 40, align: "center" },
  );
  doc.font("Serif-Italic").fontSize(12).fillColor(COLORS.coral).text("С любовью, «Магия»", MARGIN, certTop + 160, {
    width: CONTENT_WIDTH,
    align: "center",
  });

  doc.font("Sans").fontSize(7).fillColor(COLORS.muted).text(
    "Эта история создана по заказу и не предназначена для публичного распространения без согласия семьи.",
    MARGIN,
    PAGE_HEIGHT - 62,
    { width: CONTENT_WIDTH, align: "center" },
  );

  if (input.order.isDemo || input.order.result?.isDemo) drawDemoMark(doc);
};

export const buildBookPdf = async (input: BookPdfInput): Promise<Buffer> => {
  const coverImage = await imageFrom(input.coverData);
  const artByChapter = new Map<number, PdfImage>();
  for (const illustration of input.illustrations) {
    if (illustration.kind !== "scene" || illustration.chapterIndex === undefined) continue;
    artByChapter.set(illustration.chapterIndex, await imageFrom(illustration.data));
  }

  const doc = new PDFDocument({
    size: "A4",
    margins: { top: 0, bottom: 0, left: 0, right: 0 },
    info: {
      Title: input.story.title,
      Author: "Магия",
      Subject: "Персональная иллюстрированная сказка · " + input.order.input.childName,
      Creator: "Магия — подарки с историей",
      Producer: "Магия",
      Keywords: "сказка, персональная книга, " + input.order.orderNumber,
    },
    autoFirstPage: true,
    compress: true,
  });

  registerFonts(doc);
  drawBookCover(doc, input, coverImage);

  input.story.chapters.forEach((chapter, index) => {
    drawChapterPage(doc, input, chapter, index, artByChapter.get(index) ?? null, true);
  });

  const lastArt = [...artByChapter.values()].at(-1) ?? null;
  drawClosingPage(doc, input, lastArt);
  drawLetterPage(doc, input);

  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    doc.end();
  });
};
