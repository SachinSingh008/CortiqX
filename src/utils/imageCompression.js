import imageCompression from 'browser-image-compression'

/**
 * Compress image to ~few KB (target under 150 KB) before uploading.
 * Use for portfolio images and client logos.
 */
const defaultOptions = {
  maxSizeMB: 0.15,
  maxWidthOrHeight: 1200,
  useWebWorker: true,
  fileType: 'image/jpeg',
  initialQuality: 0.85,
}

const logoOptions = {
  maxSizeMB: 0.08,
  maxWidthOrHeight: 400,
  useWebWorker: true,
  fileType: 'image/jpeg',
  initialQuality: 0.8,
}

export async function compressImage(file, options = {}) {
  const opts = { ...defaultOptions, ...options }
  try {
    const compressed = await imageCompression(file, opts)
    return compressed
  } catch (err) {
    console.error('Image compression failed:', err)
    return file
  }
}

export async function compressLogo(file) {
  return compressImage(file, logoOptions)
}

/** Formats that can carry alpha; JPEG would flatten transparency to an opaque background. */
export function isAlphaCapableImageType(file) {
  const t = file?.type || ''
  return (
    t === 'image/png' ||
    t === 'image/webp' ||
    t === 'image/gif' ||
    t === 'image/avif'
  )
}

const featuredCoverPreserveAlphaOptions = {
  maxSizeMB: 0.45,
  maxWidthOrHeight: 1200,
  useWebWorker: true,
  fileType: 'image/png',
  initialQuality: 0.92,
}

/**
 * Featured project card cover: keep transparency for PNG/WebP/etc. by avoiding JPEG re-encode.
 */
export async function compressFeaturedProjectCover(file) {
  if (isAlphaCapableImageType(file)) {
    return compressImage(file, featuredCoverPreserveAlphaOptions)
  }
  return compressImage(file)
}
