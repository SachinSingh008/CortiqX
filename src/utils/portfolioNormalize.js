/** Normalize Firestore `portfolio` document for public UI */
export function normalizePortfolioDoc(data, id) {
  return {
    id,
    title: data.title || '',
    shortDescription: data.shortDescription || '',
    fullDescription: data.fullDescription || '',
    domain: data.domain || '',
    url: data.url || '',
    image: typeof data.image === 'string' ? data.image : '',
    images: Array.isArray(data.images) ? data.images.filter(Boolean) : [],
    technologies: Array.isArray(data.technologies) ? data.technologies.filter(Boolean) : [],
    order: Number.isFinite(Number(data.order)) ? Number(data.order) : 0,
  }
}

export function portfolioHeroImage(project) {
  if (!project) return null
  if (project.image?.trim()) return project.image.trim()
  const first = project.images?.find((u) => typeof u === 'string' && u.trim())
  return first ? first.trim() : null
}

export const WEB_DEVELOPMENT_DOMAIN = 'web-development'
