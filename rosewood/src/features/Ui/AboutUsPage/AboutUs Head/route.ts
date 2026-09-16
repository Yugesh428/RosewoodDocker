// app/api/ui/about/index.ts

export const ABOUT_ROUTES = {
  get: "GET  /api/ui/about",
  update: "PUT  /api/ui/about",
} as const;

export { getAboutUs, updateAboutUs } from "./aboutUsTitleController";
