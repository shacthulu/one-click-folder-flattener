/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: "https://bitfire.ai/tools/one-click-folder-flattener", // Your website URL
  generateRobotsTxt: true, // (Optional) Generate a robots.txt file
  exclude: ["/server-sitemap.xml"], // Exclude any pages you don't want in the sitemap
};
