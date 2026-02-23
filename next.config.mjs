const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  serverExternalPackages: ["mongoose", "mongodb"],
 
  async rewrites() {
    if (process.env.NODE_ENV === 'development') {
      return [
        {
          source: '/api/py/:path*',
          destination: 'http://127.0.0.1:8000/:path*',
        },
      ]
    }
    return []
  },
}

export default nextConfig
