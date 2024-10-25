/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    serverRuntimeConfig: {
      POSTGRES_URL: process.env.POSTGRES_URL, // 서버에서만 접근 가능한 변수
    },
    publicRuntimeConfig: {
      POSTGRES_URL: process.env.POSTGRES_URL, // 클라이언트에서도 접근 가능한 변수
    },
    pageExtensions: ['js', 'jsx', 'ts', 'tsx'],
    env: {
      POSTGRES_URL: process.env.POSTGRES_URL, // 이 설정을 통해 클라이언트에서도 직접 접근 가능
    },
  }
  
  module.exports = nextConfig;
  