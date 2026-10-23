import type { Order } from "@/lib/orders/types";
import { formatPrice } from "@/lib/format";

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const layout = (params: {
  title: string;
  preheader: string;
  body: string;
  footerNote?: string;
  privacyUrl: string;
}) => `<!doctype html>
<html lang="ru">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;background:#f4f1e8;color:#172038;font-family:Arial,Helvetica,sans-serif;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(params.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f1e8;padding:28px 12px;">
<tr><td align="center">
<table role="presentation" width="100%" style="max-width:560px;background:#fffdf7;border-radius:16px;overflow:hidden;border:1px solid #e4ddcc;">
<tr><td style="background:#172a87;padding:22px 30px;color:#fffdf7;">
<div style="font-family:Georgia,'Times New Roman',serif;font-size:26px;letter-spacing:-0.5px;">магия</div>
<div style="font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#ffd86b;margin-top:3px;">подарки с историей</div>
</td></tr>
<tr><td style="padding:30px;">
<div style="font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:#f4654e;font-weight:bold;margin-bottom:12px;">персональная сказка</div>
<h1 style="font-family:Georgia,'Times New Roman',serif;font-size:27px;line-height:1.18;margin:0 0 18px;color:#172038;font-weight:normal;">${params.title}</h1>
${params.body}
</td></tr>
<tr><td style="padding:18px 30px 26px;border-top:1px solid #eee7d8;color:#7a8090;font-size:11px;line-height:1.6;">
${escapeHtml(params.footerNote ?? "Вы получили это письмо, потому что указали адрес при оформлении заказа в сервисе «Магия».")}
<div style="margin-top:10px;">© 2026 «Магия» · <a href="${escapeHtml(params.privacyUrl)}" style="color:#263cc4;">Политика данных</a></div>
</td></tr>
</table>
</td></tr>
</table>
</body></html>`;

const button = (href: string, label: string) =>
  `<a href="${escapeHtml(href)}" style="display:inline-block;background:#f4654e;color:#ffffff;text-decoration:none;font-weight:bold;font-size:13px;padding:14px 22px;border-radius:10px;box-shadow:0 4px 0 #cf4c38;">${escapeHtml(label)}</a>`;

const paragraph = (text: string) =>
  `<p style="font-size:14px;line-height:1.65;color:#4f586b;margin:0 0 14px;">${text}</p>`;

const privacyUrlFor = (orderLink: string) => {
  try {
    return new URL("/privacy", orderLink).toString();
  } catch {
    return "/privacy";
  }
};

export const buildOrderCreatedEmail = (order: Order, orderLink: string) => {
  const safeName = escapeHtml(order.input.childName);
  const demo = order.isDemo
    ? `<div style="background:#ffe4dc;border-left:3px solid #f4654e;padding:12px 14px;margin:0 0 18px;font-size:12px;line-height:1.55;color:#7e342d;"><strong>Демонстрационный режим.</strong> Эта книга будет создана встроенным демо-генератором, а не коммерческим AI-сервисом.</div>`
    : "";
  const body = `
    ${demo}
    ${paragraph("Здравствуйте! Заказ <strong>" + escapeHtml(order.orderNumber) + "</strong> для " + safeName + " создан. Стоимость — " + escapeHtml(formatPrice(order.priceRub)) + ".")}
    ${paragraph("Сохраните личную ссылку на заказ. По ней можно вернуться к статусу, оплате и готовой книге. Регистрация не нужна, а ссылка не индексируется поисковиками.")}
    <div style="margin:22px 0 24px;">${button(orderLink, "Открыть заказ")}</div>
    ${paragraph("Если вы ещё не завершили оплату, сделать это можно на странице заказа. Если ссылка не открывается, ответьте на это письмо или напишите в поддержку.")}
    <div style="background:#f4f1e8;border-radius:10px;padding:14px 16px;font-size:11px;line-height:1.55;color:#7a8090;">Никому не пересылайте личную ссылку: она даёт доступ к данным заказа и готовой книге.</div>
  `;
  const text = [
    "Магия — персональная сказка",
    "",
    "Заказ " + order.orderNumber + " для " + order.input.childName + " создан.",
    "Стоимость: " + formatPrice(order.priceRub) + ".",
    order.isDemo ? "ДЕМО-РЕЖИМ: книга будет создана встроенным демонстрационным генератором." : "",
    "",
    "Личная ссылка на заказ:",
    orderLink,
    "",
    "Сохраните её. Регистрация не нужна. Никому не пересылайте эту ссылку.",
  ].filter(Boolean).join("\n");

  return {
    to: order.email,
    subject: "Заказ " + order.orderNumber + " создан — «Магия»",
    text,
    html: layout({
      title: "Заказ создан",
      preheader: "Личная ссылка на ваш заказ " + order.orderNumber,
      body,
      footerNote: "Письмо отправлено по адресу, указанному при оформлении заказа.",
      privacyUrl: privacyUrlFor(orderLink),
    }),
    tags: { orderId: order.id, kind: "order_created" },
  };
};

export const buildBookReadyEmail = (order: Order, orderLink: string) => {
  const title = order.result?.story.title ?? "Ваша персональная сказка";
  const demo = order.isDemo
    ? `<div style="background:#ffe4dc;border-left:3px solid #f4654e;padding:12px 14px;margin:0 0 18px;font-size:12px;line-height:1.55;color:#7e342d;"><strong>Демо-версия.</strong> Книга создана встроенным демо-генератором и отмечена как демонстрационная.</div>`
    : "";
  const body = `
    ${demo}
    ${paragraph("Сказка «" + escapeHtml(title) + "» для " + escapeHtml(order.input.childName) + " готова.")}
    ${paragraph("Внутри — " + String(order.result?.story.chapters.length ?? 9) + " глав, иллюстрации и личное письмо. Книгу можно читать онлайн или скачать PDF.")}
    <div style="margin:22px 0 24px;">${button(orderLink, "Открыть книгу")}</div>
    ${paragraph("PDF хранится в приватном хранилище и доступен только по вашей личной ссылке.")}
    <div style="background:#f4f1e8;border-radius:10px;padding:14px 16px;font-size:11px;line-height:1.55;color:#7a8090;">Заказ ${escapeHtml(order.orderNumber)}. Если возникли вопросы, напишите в поддержку.</div>
  `;
  const text = [
    "Магия — персональная сказка",
    "",
    "Сказка «" + title + "» для " + order.input.childName + " готова.",
    order.isDemo ? "ДЕМО-ВЕРСИЯ: книга создана демонстрационным генератором." : "",
    "",
    "Открыть книгу и скачать PDF:",
    orderLink,
    "",
    "Заказ " + order.orderNumber + ". PDF доступен только по личной ссылке.",
  ].filter(Boolean).join("\n");

  return {
    to: order.email,
    subject: "«" + title + "» готова — «Магия»",
    text,
    html: layout({
      title: "Книга готова",
      preheader: "Сказка «" + title + "» ждёт вас",
      body,
      footerNote: "Письмо отправлено по адресу, указанному при оформлении заказа.",
      privacyUrl: privacyUrlFor(orderLink),
    }),
    tags: { orderId: order.id, kind: "book_ready" },
  };
};
