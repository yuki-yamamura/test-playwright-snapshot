import { chromium, expect } from "@playwright/test";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const sitemapUrl = "http://localhost:3000/server-sitemap.xml";

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto(sitemapUrl);
  const html = await page.content();
  const urls =
    html
      .match(/<loc>(.*?)<\/loc>/g)
      ?.map((regex) => regex.replace(/<\/?loc>/g, "")) || [];

  for (const url of urls) {
    const page = await context.newPage();
    await page.goto(url);

    const lazyImages = await (
      await page.locator('img[loading="lazy"]:visible')
    ).all();
    for (const image of lazyImages) {
      await image.scrollIntoViewIfNeeded({ timeout: 0 });
      await expect(image).not.toHaveJSProperty("naturalWidth", 0);
    }

    const fullPath = path.join(process.pid.toString(), `${uuidv4()}.png`);
    await page.screenshot({ path: fullPath, fullPage: true, timeout: 0 });
    console.log(`${fullPath} saved`);
  }

  await browser.close();
})();
