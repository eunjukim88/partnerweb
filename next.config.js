/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverRuntimeConfig: {
    POSTGRES_URL: process.env.POSTGRES_URL,
  },
  pageExtensions: ['js', 'jsx', 'ts', 'tsx'],
}

module.exports = {
  env: {
    POSTGRES_URL: process.env.POSTGRES_URL,
  },
}
