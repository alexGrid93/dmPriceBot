import "dotenv/config";
import { Telegraf, Markup } from "telegraf";
import { setIntervalAsync } from "set-interval-async/dynamic/index.js";
import {
  getGoodInfo,
  firstMessage,
  getData,
  allGoodsMessage,
} from "./utils.js";

const delay = 100000;
const allGoods = [];

const telegramBotToken = process.env.BOT_TOKEN;
const bot = new Telegraf(telegramBotToken); //сюда помещается токен, который дал botFather

bot.start((ctx) => {
  ctx.reply(
    "Введите ссылки на товары через пробел",
    Markup.keyboard(["🔍 Показать список товаров на проверке"])
      .oneTime()
      .resize()
  );
});

bot.hears("🔍 Показать список товаров на проверке", (ctx) =>
  ctx.replyWithMarkdown(allGoodsMessage(allGoods))
);

bot.on("text", async (ctx) => {
  const urls = ctx.message.text.split(" ");

  allGoods.length = 0;

  try {
    for (const url of urls) {
      const good = await getGoodInfo(url).then((el) => getData(el));

      allGoods.push(good);
    }

    const message = allGoods.reduce((acc, { title, price }) => {
      const m = firstMessage(title, price);

      return acc + m;
    }, "");

    ctx.replyWithMarkdown(
      allGoods.length
        ? message +
            "Мы будем каждый час мониторить цену по этим позициям. Если цена изменится, вы получите уведомление"
        : "Не можем найти товар по этой ссылке"
    );

    setIntervalAsync(async () => {
      const newGoodsInfo = await Promise.all(
        urls.map(async (url) => {
          const good = await getGoodInfo(url).then((el) => getData(el));
          return good;
        })
      );

      newGoodsInfo.forEach(({ title, price }, index) => {
        if (price === allGoods[index].price) {
          ctx.replyWithMarkdown(`Цена на *${title}* не изменилась. `);
        } else {
          ctx.replyWithMarkdown(
            `🧡🧡🧡 Цена на *${title}* изменилась! Ссылка: ${urls[index]}`
          );
          allGoods[index].price = price;
        }
      });
    }, delay);
  } catch (e) {
    ctx.reply(e);
  }
});

bot.launch(); // запуск бота
