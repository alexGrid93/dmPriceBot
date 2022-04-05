const axios = require("axios");
const cheerio = require("cheerio");
require("dotenv").config();
const { Telegraf } = require("telegraf");
const { setIntervalAsync } = require("set-interval-async/dynamic");

const telegramBotToken = process.env.BOT_TOKEN;
const bot = new Telegraf(telegramBotToken); //сюда помещается токен, который дал botFather

const getGoodInfo = (url) =>
  axios
    .get(url)

    .then((response) => response.data)
    .catch((error) => console.log(error));

const getData = (html) => {
  const $ = cheerio.load(html);

  const good = {
    title: $("h1").text(),
    price: $(".Jg").text(),
  };

  return good;
};

const firstMessage = (title, price) => `🔍 ${title}
  
💸 *${price}*

Мы будем каждый час мониторить цену по этой позиции. Если цена изменится, вы получите уведомление`;

bot.start((ctx) => ctx.reply("Введите ссылку на страницу"));

bot.on("text", async (ctx) => {
  const url = ctx.message.text;
  const good = await getGoodInfo(url).then((el) => getData(el));
  ctx.replyWithMarkdown(firstMessage(good.title, good.price));
  const currentPrice = good.price;

  setIntervalAsync(async () => {
    const newGoodInfo = await getGoodInfo(url).then((el) => getData(el));

    if (newGoodInfo.price === currentPrice) {
      ctx.replyWithMarkdown(`*Цена на ${newGoodInfo.title} не изменилась*`);
    } else {
      ctx.replyWithMarkdown(
        `*Цена изменилась! Ссылка: ${"https://detmir.ru/product/index/id/3187781/"}*`
      );
    }
  }, 4000);
});

bot.command("/an", (ctx) => {
  let animalMessage = `great, here are pictures of animals you would love`;
  ctx.deleteMessage();
  bot.telegram.sendMessage(ctx.chat.id, animalMessage, {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "dog",
            callback_data: "dog",
          },
          {
            text: "cat",
            callback_data: "cat",
          },
        ],
      ],
    },
  });
});

bot.launch(); // запуск бота
