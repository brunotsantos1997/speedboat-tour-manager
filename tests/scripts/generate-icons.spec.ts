import { test } from '@playwright/test';

test('Generate generic boat icons', async ({ page }) => {
  const svgContent = `
    <svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1 .6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
      <path d="M19.38 20A11.6 11.6 0 0 0 21 14l-9-4-9 4c0 2.26 1.13 4.43 2.62 6" />
      <path d="M12 10V2l4 2-4 2" />
    </svg>
  `;

  // 512x512
  await page.setViewportSize({ width: 512, height: 512 });
  await page.setContent(`
    <div id="icon-512" style="width: 512px; height: 512px; display: flex; align-items: center; justify-content: center; background: white;">
      ${svgContent}
    </div>
  `);
  await page.locator('#icon-512').screenshot({ path: 'public/pwa-512x512.png' });

  // 192x192
  await page.setViewportSize({ width: 192, height: 192 });
  await page.setContent(`
    <div id="icon-192" style="width: 192px; height: 192px; display: flex; align-items: center; justify-content: center; background: white;">
      <div style="transform: scale(0.48);">
        ${svgContent}
      </div>
    </div>
  `);
  await page.locator('#icon-192').screenshot({ path: 'public/pwa-192x192.png' });

  // apple-touch-icon.png (180x180)
  await page.setViewportSize({ width: 180, height: 180 });
  await page.setContent(`
    <div id="icon-180" style="width: 180px; height: 180px; display: flex; align-items: center; justify-content: center; background: white;">
       <div style="transform: scale(0.45);">
        ${svgContent}
      </div>
    </div>
  `);
  await page.locator('#icon-180').screenshot({ path: 'public/apple-touch-icon.png' });
});
