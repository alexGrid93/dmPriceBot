const axios = require("axios");
const cheerio = require("cheerio");
require("dotenv").config();
const { Telegraf } = require("telegraf");
const { setIntervalAsync } = require("set-interval-async/dynamic");

const delay = 10000000;

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
    price: $("aside > div > div > div > div > div").first().text(),
  };

  return good;
};

const firstMessage = (title, price) => `🔍 ${title} — *${price}*
  
`;

bot.start((ctx) => ctx.reply("Введите ссылку на страницу"));

bot.on("text", async (ctx) => {
  const urls = ctx.message.text.split(" ");

  try {
    const goods = await Promise.all(
      urls.map(async (url) => {
        const good = await getGoodInfo(url).then((el) => getData(el));
        return good;
      })
    );

    const message = goods.reduce((acc, { title, price }) => {
      const m = firstMessage(title, price);

      return acc + m;
    }, "");

    ctx.replyWithMarkdown(
      message +
        "Мы будем каждый час мониторить цену по этим позициям. Если цена изменится, вы получите уведомление"
    );

    const currentPrices = goods.map(({ price }) => price);

    setIntervalAsync(async () => {
      const newGoodsInfo = await Promise.all(
        urls.map(async (url) => {
          const good = await getGoodInfo(url).then((el) => getData(el));
          return good;
        })
      );

      newGoodsInfo.forEach(({ title, price }, index) => {
        if (price === currentPrices[index]) {
          ctx.replyWithMarkdown(`Цена на *${title}* не изменилась. `);
        } else {
          ctx.replyWithMarkdown(
            `🧡🧡🧡 Цена на *${title}* изменилась! Ссылка: ${urls[index]}`
          );
          currentPrices[index] = price;
        }
      });
    }, delay);
  } catch (e) {
    ctx.reply(e);
  }
});

bot.launch(); // запуск бота
