module.exports = {
  apps: [
    {
      name: "nextcrm-app",
      script: "./server.js",
      cwd: "/var/www/UKRBA-CMS/.next/standalone",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        // Load the environment variables explicitly
        DATABASE_URL: "postgresql://nextcrm:changeme@localhost:5432/nextcrm?schema=public",
        NEXT_PUBLIC_APP_URL: "https://crm.ukrba.org",
        BETTER_AUTH_SECRET: "generate-with-openssl-rand-base64-32",
        BETTER_AUTH_URL: "https://crm.ukrba.org",
        RESEND_API_KEY: "re_P3vviF8z_LomPoYqUxVUwfeWEJYc8WLFA",
        EMAIL_FROM: "onboarding@resend.dev",
        NEXT_PUBLIC_APP_NAME: "UKRBA CRM",
        OPENAI_API_KEY: "sk-placeholder-not-real",
        CRON_SECRET: "cron_secret_12345",
        EMAIL_ENCRYPTION_KEY: "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
        WIX_WEBHOOK_TOKEN: "secure_token_123456"
      }
    }
  ]
};
