import axios from "axios";
import * as cheerio from "cheerio";

export const getGoodInfo = (url) =>
  axios
    .get(url)

    .then((response) => response.data)
    .catch((error) => console.log(error));

export const getData = (html) => {
  const $ = cheerio.load(html);

  const good = {
    title: $("h1").text(),
    price: $("aside > div > div > div > div > div").first().text(),
  };

  return good;
};

export const firstMessage = (title, price) => `🔍 ${title} — *${price}*

`;

export const allGoodsMessage = (allGoods) =>
  allGoods.length
    ? allGoods.reduce((acc, { title, price }) => {
        const m = firstMessage(title, price);

        return acc + m;
      }, "")
    : "Вы не отслеживаете ни одного товара";
