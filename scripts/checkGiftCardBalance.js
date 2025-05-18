import { Stagehand } from "@browserbasehq/stagehand";
import { z } from "zod";

export async function checkGiftCardBalance({ url, card_number, expiration_date, cvv }) {
  const stagehand = new Stagehand({
    env: "BROWSERBASE",
    apiKey: process.env.BROWSERBASE_API_KEY,
    projectId: process.env.BROWSERBASE_PROJECT_ID,
    openAiApiKey: process.env.OPENAI_API_KEY,
    verbose: 1,
    disablePino: true,
    logger: console.log
  });

  await stagehand.init();
  const page = stagehand.page;

  // Track captcha solving status via browser console messages
  let captchaSolving = false;

  page.on("console", (msg) => {
    const text = msg.text();
    console.log("[Browser Console]", text);

    if (text.includes("browserbase-solving-started")) {
      captchaSolving = true;
      console.log("🛡 CAPTCHA solving started...");
    }

    if (text.includes("browserbase-solving-finished")) {
      captchaSolving = false;
      console.log("✅ CAPTCHA solving finished.");
    }
  });

  await page.goto(url);

  console.log("➡️ Filling in card details...");
  await page.act(`Find the input field where the card number should be entered and type ${card_number}`);

  if (expiration_date) {
    await page.act(`If there is one, find the expiration date input and type ${expiration_date}`);
  }

  if (cvv) {
    await page.act(`If there is one, find the PIN number input and type ${cvv}`);
  }

  console.log("⏳ Waiting for CAPTCHA (if present) to be solved...");
  // Wait for CAPTCHA solving to finish, if it started
  if (captchaSolving) {
    await new Promise((resolve) => {
      const interval = setInterval(() => {
        if (!captchaSolving) {
          clearInterval(interval);
          resolve();
        }
      }, 1000);
    });
  }

  console.log("✅ CAPTCHA done. Proceeding to click submit...");
  await page.act("Click the enter/check balance/submit button and wait for result");

  const { result } = await page.extract({
    instruction: "Find the gift card balance displayed on the page. Extract only the numeric value.",
    schema: z.object({
      result: z.object({
        balance: z.number(),
      }),
    }),
  });

  await stagehand.close();

  return result.balance;
}
