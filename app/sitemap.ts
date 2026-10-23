import type { MetadataRoute } from "next";

const appUrl = (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return [
    { url: appUrl + "/", lastModified, changeFrequency: "weekly", priority: 1 },
    { url: appUrl + "/create", lastModified, changeFrequency: "monthly", priority: 0.9 },
    { url: appUrl + "/recover", lastModified, changeFrequency: "yearly", priority: 0.3 },
    { url: appUrl + "/legal/privacy", lastModified, changeFrequency: "yearly", priority: 0.4 },
    { url: appUrl + "/legal/consent", lastModified, changeFrequency: "yearly", priority: 0.4 },
    { url: appUrl + "/legal/terms", lastModified, changeFrequency: "yearly", priority: 0.4 },
    { url: appUrl + "/legal/requisites", lastModified, changeFrequency: "yearly", priority: 0.3 },
  ];
}
