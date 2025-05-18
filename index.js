import express from "express";
import { checkGiftCardBalance } from "./scripts/checkGiftCardBalance.js";

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.post("/check-balance", async (req, res) => {
  console.log("POST /check-balance hit with body:", req.body);
  const { url, card_number, expiration_date, cvv } = req.body;
  try {
    const balance = await checkGiftCardBalance({
      url,
      card_number,
      expiration_date,
      cvv,
    });
    res.json({ giftCardBalance: balance });
  } catch (error) {
    console.error("Error checking balance:", error);
    res.status(500).json({ error: "Failed to fetch gift card balance" });
  }
});

app.listen(port, () => {
  console.log(`API is running on port ${port}`);
});
