/** Treat common Firestore / console values as “published” for the public home section */
export function isFeaturedPublished(value) {
  return value === true || value === 'true' || value === 1
}

/** Theme keys stored in Firestore; map to card CSS + phone tone */
export const FEATURED_THEMES = {
  sky: { label: 'Sky blue', className: 'fyw-stack-card--sky', tone: '221 83% 53%' },
  amber: { label: 'Amber', className: 'fyw-stack-card--amber', tone: '38 88% 48%' },
  rose: { label: 'Rose', className: 'fyw-stack-card--rose', tone: '330 68% 48%' },
  coral: { label: 'Coral', className: 'fyw-stack-card--coral', tone: '20 88% 52%' },
  violet: { label: 'Violet', className: 'fyw-stack-card--violet', tone: '262 83% 58%' },
  cyan: { label: 'Cyan', className: 'fyw-stack-card--cyan', tone: '199 89% 42%' },
}

export function normalizeFeaturedProject(data, id) {
  const key =
    data.theme && FEATURED_THEMES[data.theme] ? data.theme : 'sky'
  const t = FEATURED_THEMES[key]
  const toneOverride =
    typeof data.tone === 'string' && data.tone.trim() ? data.tone.trim() : null
  return {
    id,
    published: isFeaturedPublished(data.published),
    order: (() => {
      const n = Number(data.order)
      return Number.isFinite(n) ? n : 0
    })(),
    title: data.title || '',
    client: data.client || '',
    url: data.url || '',
    deliverables: data.deliverables || '',
    industry: data.industry || '',
    image: data.image || '',
    theme: t.className,
    tone: toneOverride || t.tone,
  }
}
