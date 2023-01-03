const axios = require("axios");
const cheerio = require("cheerio");

const url = new URL("https://jumia.com.ng/catalog");
const baseUrl = url.origin; /* jumia origin */

async function scrapeData(query) {
  // append search query
  url.searchParams.append("q", query);
  const scraped_data = [];

  // load the html from the url
  const { data, status, error } = await axios.get(url.toString());

  if (status >= 400) {
    throw error; /* handle errors from initial page fetch */
  }

  const $ = cheerio.load(data); /* parse the loaded html with cheerio */

  // set scrape url to page pathname if incase of redirect
  const path_name = $("head").children("meta")["5"].attribs.content;
  url.pathname = path_name;

  // get last page number
  const lastPageLink =
    $(".pg-w.-ptm.-pbxl").children()[
      $(".pg-w.-ptm.-pbxl").children().length - 1
    ];
  const lastPageUrl = $(lastPageLink).attr("href");

  const last_page = extractPageNum(lastPageUrl);

  const scrape = async url => {
    let data;
    let _$;
    if (url) {
      // get and parse data from the new url
      data = await axios.get(url.toString());
      _$ = cheerio.load(data.data);
    } else {
      _$ = $;
    }

    // break down children and store text-content
    const list_items = _$("article.prd._fb.col.c-prd a");
    list_items.each((i, el) => {
      let href = _$(el).attr("href");
      let img_container = _$(el).children(".img-c");
      let img_link = _$(img_container).children("img").attr("data-src");
      let info_container = _$(el).children(".info");
      let name = _$(info_container).children(".name").text();
      let price = _$(info_container).children(".prc").text();
      scraped_data.push({
        link: baseUrl + href,
        name,
        price,
        thumbnail: img_link,
      });
    });
  };

  // scrape the first page
  await scrape();

  // next function's return includes another next function
  // until the last page
  const next = async (i = 2) => {
    scraped_data.splice(0, scraped_data.length);
    url.searchParams.get("page")
      ? url.searchParams.set("page", i)
      : url.searchParams.append("page", i);
    await scrape(url + "#catalog-listing");
    return {
      data: scraped_data,
      next: i < last_page ? () => next(i + 1) : undefined,
    };
  };

  return {
    data: scraped_data,
    // include next function for pagination
    next: () => next(),
  };
}

module.exports = scrapeData;

// extracts the page number
// from a pathname that looks like:
// /catalog/?page=50#catalog-listing
function extractPageNum(path) {
  if (!path) return 1;
  const searchParams = new URLSearchParams(
    path.slice(path.indexOf("page"))
  );
  const page = searchParams.get("page");
  return parseInt(page);
}
