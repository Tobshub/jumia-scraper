A web scraper for the popular e-commerce site jumia.com.ng.

## Usage

```
const jumiaScraper = require("jumia-scraper");

const res = jumiaScraper("xyz");
console.log(res.data) // {link, name, price, thumbnail}[]
```

## Installation

`> npm install jumia-scraper`

## Features

- search for any product that is available on Jumia
- returns the link-to, name, price, and thumbnail image of the product search results
- minimal and fast
