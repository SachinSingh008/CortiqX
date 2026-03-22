import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { storage } from '../firebase/config'
import { compressImage, compressLogo, compressFeaturedProjectCover } from './imageCompression'

/**
 * Get Storage path from a Firebase Storage download URL.
 * URL format: .../v0/b/BUCKET/o/ENCODED_PATH?alt=media&token=...
 */
function getStoragePathFromUrl(downloadUrl) {
  try {
    const match = downloadUrl.match(/\/o\/(.+?)(?:\?|$)/)
    return match ? decodeURIComponent(match[1]) : null
  } catch {
    return null
  }
}

/**
 * Delete a file from Firebase Storage by its download URL.
 * Safe to call if URL is empty or invalid; logs and ignores errors (e.g. already deleted).
 */
export async function deleteStorageFileByUrl(downloadUrl) {
  if (!downloadUrl || typeof downloadUrl !== 'string') return
  const url = downloadUrl.trim()
  if (!url.includes('firebasestorage.googleapis.com')) return
  const path = getStoragePathFromUrl(url)
  if (!path) return
  try {
    const storageRef = ref(storage, path)
    await deleteObject(storageRef)
  } catch (err) {
    if (err?.code === 'storage/object-not-found') return
    console.warn('Storage delete failed:', err?.message || err)
  }
}

/**
 * Delete multiple Storage files by their download URLs. Runs in parallel; ignores failures.
 */
export async function deleteStorageFilesByUrls(urls) {
  if (!Array.isArray(urls) || urls.length === 0) return
  await Promise.allSettled(urls.map((u) => deleteStorageFileByUrl(u)))
}

/**
 * Upload image to Firebase Storage with compression (MBs -> few KBs).
 * Returns the public download URL.
 */
export async function uploadPortfolioImage(projectId, file, pathPrefix = 'main') {
  const compressed = await compressImage(file)
  const ext = compressed.name.split('.').pop() || 'jpg'
  const storageRef = ref(storage, `portfolio/${projectId}/${pathPrefix}_${Date.now()}.${ext}`)
  await uploadBytes(storageRef, compressed)
  return getDownloadURL(storageRef)
}

/**
 * Upload multiple gallery images. Returns array of download URLs.
 */
export async function uploadPortfolioGallery(projectId, files) {
  const urls = []
  for (let i = 0; i < files.length; i++) {
    const compressed = await compressImage(files[i])
    const ext = compressed.name.split('.').pop() || 'jpg'
    const storageRef = ref(storage, `portfolio/${projectId}/gallery_${i}_${Date.now()}.${ext}`)
    await uploadBytes(storageRef, compressed)
    urls.push(await getDownloadURL(storageRef))
  }
  return urls
}

/**
 * Upload client logo (compressed for small size).
 */
export async function uploadClientLogo(clientId, file) {
  const compressed = await compressLogo(file)
  const ext = compressed.name.split('.').pop() || 'jpg'
  const storageRef = ref(storage, `clients/${clientId}/logo_${Date.now()}.${ext}`)
  await uploadBytes(storageRef, compressed)
  return getDownloadURL(storageRef)
}

/** Home “Featured projects” card cover — public read path `featuredProjects/…` */
export async function uploadFeaturedProjectImage(projectId, file) {
  const compressed = await compressFeaturedProjectCover(file)
  const ext = compressed.name.split('.').pop() || 'jpg'
  const storageRef = ref(storage, `featuredProjects/${projectId}/cover_${Date.now()}.${ext}`)
  const contentType = compressed.type || (ext === 'png' ? 'image/png' : 'image/jpeg')
  await uploadBytes(storageRef, compressed, { contentType })
  return getDownloadURL(storageRef)
}
