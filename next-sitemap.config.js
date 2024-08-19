/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: "https://folder-flattener.bitfire.dev/", // Your website URL
  generateRobotsTxt: true, // (Optional) Generate a robots.txt file
  exclude: ["/server-sitemap.xml"], // Exclude any pages you don't want in the sitemap
};
