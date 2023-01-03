const axios = require("axios");
const cheerio = require("cheerio");
const pretty = require("pretty");
const prompt = require("prompt-sync")();

const url = new URL("https://jumia.com.ng/catalog");

async function scrapeData(query) {
  url.searchParams.append("q", query);
  const scraped_data = [];
  // load the html from the url
  const { data } = await axios.get(url.toString());

  // parse the html with cheerio
  const $ = cheerio.load(data);

  // set url scrape url to new page pathname if redirected
  const path_name = $("head").children("meta")["5"].attribs.content;
  url.pathname = path_name;

  // get last page to loop over
  const lastPageLink =
    $(".pg-w.-ptm.-pbxl").children()[
      $(".pg-w.-ptm.-pbxl").children().length - 1
    ];
  const lastPageUrl = $(lastPageLink).attr("href");

  const last_page = extractPageNum(lastPageUrl);

  const scrape = async url => {
    // reload new and parse new data
    const { data } = url ? await axios.get(url.toString()) : undefined;
    const $ = data ? cheerio.load(data) : $;

    // break down children and store text-content
    const list_items = $("article.prd._fb.col.c-prd a");
    list_items.each((i, el) => {
      let href = $(el).attr("href");
      let img_container = $(el).children(".img-c");
      let img_link = $(img_container).children("img").attr("data-src");
      let info_container = $(el).children(".info");
      let name = $(info_container).children(".name").text();
      let price = $(info_container).children(".prc").text();
      scraped_data.push({
        link: href,
        name,
        price,
        thumbnail: img_link,
      });
    });
  };
  // use a for loop of the max pagination range to get all the items

  for (let i = 1; i <= last_page; i++) {
    if (i === 1) {
      scrape();
    } else {
      url.searchParams.get("page")
        ? url.searchParams.set("page", i)
        : url.searchParams.append("page", i);
      scrape(url + "#catalog-listing");
    }
  }
  return scraped_data;
}

scrapeData(prompt("please provide a search query: ")).then(res =>
  console.log(/*"content", res,*/ "\nsize", res.length)
);

module.export = scrapeData;

// extracts the last page number
// from a pathname that looks like:
// /catalog/?q=aaa&page=50#catalog-listing
function extractPageNum(path) {
  const searchParams = new URLSearchParams(path);
  const page = searchParams.get("page");
  return parseInt(page);
}
