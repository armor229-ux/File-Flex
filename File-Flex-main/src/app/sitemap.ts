import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://file-flex-psi.vercel.app'
  const routes = [
    '',
    '/tools/pdf-merge',
    '/tools/pdf-compress',
    '/tools/pdf-password',
    '/tools/image-compress',
    '/tools/password-generator',
  ]
  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1 : 0.8,
  }))
}
