import { Page } from 'playwright';

export async function scroll(
  page: Page,
  {
    deltaX,
    deltaY,
    wait = 100,
  }: {
    deltaX: number;
    deltaY: number;
    wait?: number | null;
  },
) {
  //use the mouse to scroll down with the space bar
  await page.mouse.wheel(deltaX, deltaY);

  if (wait !== null) {
    await page.waitForTimeout(wait);
  }
}
