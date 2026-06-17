const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

module.exports = {
  apps: [
    {
      name: "nextcrm-app",
      script: "./server.js",
      cwd: "/var/www/UKRBA-CMS/.next/standalone",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        ...process.env,
      },
    },
  ],
};
