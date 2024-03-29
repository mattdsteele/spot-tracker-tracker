import { BrowserContext, LaunchOptions, Page } from "playwright";
import { chromium } from "playwright-extra";
import { tmpdir } from "os";
// https://www.npmjs.com/package/@sparticuz/chromium

const ENABLED = process.env.CASEYS_ENABLE || "false";
// Load the stealth plugin and use defaults (all tricks to hide playwright usage)
// Note: playwright-extra is compatible with most puppeteer-extra plugins
const stealth = require("puppeteer-extra-plugin-stealth")();
// Add the plugin to playwright (any number of plugins can be added)

export interface OrderOptions {
  zip: string;
  time: string;
  isSimulation: boolean;
  recordVideo: boolean;
}

export type Result = {
  video: string;
  simulation: boolean;
};

export async function main(
  order: OrderOptions,
  launchOptions: LaunchOptions,
): Promise<Result> {
  console.log("about to launch");
  console.log(`actually enabled? ${isEnabled(order)}`);
  const { page, browser, context } = await launch(launchOptions, order);
  console.log("launched");

  await page.goto("https://caseys.com");

  await login();
  await page.waitForLoadState("domcontentloaded");
  await startOrder(order.zip, order.time);
  await clearExistingCart();
  await openMenu();

  await orderCustomPizza();
  //   await orderTacoPizza();
  // await orderHawaiianPizza();
  // await orderBreakfastPizza();
  await checkout();

  // Actually submit the order
  if (isEnabled(order)) {
    // Ugly but it works
    await page
      .locator(
        "#App > main > div.full-site-width > section > div.text-center.CheckoutPage__sticky-btn.visible > button",
      )
      .click();
  }

  console.log("All done, check the screenshot. ✨");
  await context.close();
  await browser.close();

  async function openMenu() {
    await page.locator("a", { hasText: "Menu" }).first().click();
  }

  async function orderTacoPizza() {
    await page
      .locator('[data-automation-id="categoryLink"]')
      .getByText("Pizza")
      .click();

    await page.getByText("Specialty Pizza").click();
    await page.getByText("Taco Pizza").click();

    // Large=0, Small=2
    await page
      .locator('.PdpCustomizer [data-automation-id="FoodItemSize"]')
      .selectOption("1");

    await page
      .locator('[data-automation-id="addToCartButton"]')
      .filter({ hasText: "Add to Order" })
      .filter({ hasText: "$" })
      .first()
      .click();
  }

  async function orderHawaiianPizza() {
    await page
      .locator('[data-automation-id="categoryLink"]')
      .getByText("Pizza")
      .click();

    await page.getByText("Specialty Pizza").click();
    await page.getByText("Ultimate Hawaiian Pizza").click();

    // Large=0, Small=2
    await page
      .locator('.PdpCustomizer [data-automation-id="FoodItemSize"]')
      .selectOption("0");

    await page
      .locator('[data-automation-id="addToCartButton"]')
      .filter({ hasText: "Add to Order" })
      .filter({ hasText: "$" })
      .first()
      .click();
  }
  async function orderBreakfastPizza() {
    await page
      .locator('[data-automation-id="categoryLink"]')
      .getByText("Pizza")
      .click();

    await page.getByText("Breakfast Pizza").click();
    await page.getByText("Bacon Breakfast Pizza").click();

    // Large=0, Small=2
    await page
      .locator('.PdpCustomizer [data-automation-id="FoodItemSize"]')
      .selectOption("0");

    await page
      .locator('[data-automation-id="addToCartButton"]')
      .filter({ hasText: "Add to Order" })
      .filter({ hasText: "$" })
      .first()
      .click();
  }
  async function orderCustomPizza() {
    await page
      .locator('[data-automation-id="categoryLink"]')
      .getByText("Pizza")
      .click();

    await page.getByText("Create Your Own Pizza").click();

    await page.locator('[data-automation-id="customizeButton"]').click();

    // Large=0, Small=2
    await page
      .locator('.PdpCustomizer [data-automation-id="FoodItemSize"]')
      .selectOption("2");

    const toppings = page.locator(".PdpCustomizer__toppingCategory");

    await toppings.getByLabel("Meats").click({ force: true });
    await toppings.getByText("Sausage-Mild").click();

    // Mushrooms are gone currently
    // await toppings.getByLabel("Veggies").click({ force: true });
    // await toppings.getByText("Mushrooms").click({ force: true });

    await page
      .locator('[data-automation-id="addToCartButton"]')
      .filter({ hasText: "Add to Order" })
      .filter({ hasText: "$" })
      .first()
      .click();
  }

  async function checkout() {
    await page
      .locator('[data-automation-id="reviewAndCheckoutDesktopButton"]')
      .first()
      .click();

    await page.getByRole("link", { name: "Checkout" }).first().click();

    const { CASEYS_CVV } = process.env;

    await page.getByLabel("CVV").type(CASEYS_CVV!);
  }

  async function startOrder(zip: string, time: string) {
    await page.waitForLoadState("load");
    const searchField = await findSearchFieldWithRetries(3);
    await searchField.type(zip);
    await page.waitForSelector(".pac-container");
    await searchField.press("Enter");

    const store = page.locator("[store-details-selected]").first();
    await store
      .locator('[data-automation-id="orderDateSelect"]')
      .selectOption("1");
    await store
      .locator('[data-automation-id="orderTimeSelect"]')
      .selectOption(time);
    await store.locator('[data-automation-id="startOrderButton"]').click();

    async function findSearchFieldWithRetries(retries: number) {
      if (retries === 0) {
        throw new Error("failed to find search field after 3 retries");
      }
      await page.locator('[data-automation-id="carryout"]').click();
      const searchField = page
        .locator('[data-automation-id="addressSearchField"]')
        .locator("visible=true");
      const foundSearchField = (await searchField.count()) === 1;
      if (!foundSearchField) {
        console.log("failed to find search field, on retry ", retries);
        page.waitForTimeout(1000);
        return findSearchFieldWithRetries(retries - 1);
      }
      return searchField;
    }
  }

  async function login() {
    await page
      .locator('[data-automation-id="navLink2"]')
      .filter({ hasText: "Sign in" })
      .first()
      .click();
    const { CASEYS_EMAIL, CASEYS_PASSWORD } = process.env;

    await page.locator('input[name="username"]').first().type(CASEYS_EMAIL!);
    await page.locator('input[name="password"]').first().type(CASEYS_PASSWORD!);

    await page.locator("#btn_customized_sign_in").click();
  }

  async function clearExistingCart() {
    await page.locator('[data-automation-id="desktopCartLink"]').click();
    let emptyCart = false;
    while (!emptyCart) {
      const number = await page
        .locator(".pb-3", { hasText: "There are no items in your order." })
        .count();
      if (number === 1) {
        emptyCart = true;
      } else {
        await page
          .locator('[data-automation-id="removeProductButton"]')
          .first()
          .click();
      }
    }
  }
  const video = await page.video()?.path()!;
  return {
    video,
    simulation: !isEnabled(order),
  };
}
function isEnabled(options: OrderOptions) {
  return !options.isSimulation && ENABLED === "true";
}

async function launch(
  options: LaunchOptions,
  { recordVideo }: Partial<OrderOptions>,
) {
  console.log("in main fn");
  chromium.use(stealth);
  console.log("after use stealth");
  console.log(`headless? ${options?.headless}`);
  const browser = await chromium.launch(options);
  const width = 1920;
  const height = 1080;
  let page: Page;
  let context: BrowserContext;
  if (recordVideo) {
    context = await browser.newContext({
      recordVideo: {
        dir: tmpdir(),
        size: {
          width,
          height,
        },
      },
    });
    page = await context.newPage();
  } else {
    page = await browser.newPage();
    context = page.context();
  }
  console.log("after launch");
  page.setViewportSize({ width, height });
  console.log("after new page");

  return { page, browser, context };
}
