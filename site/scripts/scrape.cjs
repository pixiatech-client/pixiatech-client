const https = require("https");
const fs = require("fs");

https.get("https://xeron.co/en/products/wp", (res) => {
  let data = "";
  res.on("data", chunk => data += chunk);
  res.on("end", () => {
    fs.writeFileSync("xeron-wp-dump.html", data);
    const media = Array.from(new Set(data.match(/\/uploads\/[^"'\s\)]+/g) || []));
    const assets = Array.from(new Set(data.match(/\/assets\/[^"'\s\)]+/g) || []));
    console.log("Media count:", media.length);
    console.log("Media:", media);
    console.log("Assets:", assets);
  });
});
