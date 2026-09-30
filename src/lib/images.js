// Posters come off phones and scanners at 4000px and several megabytes. The
// grid renders them a few hundred pixels wide, so uploading the original wastes
// the committee's bandwidth on every page load and the org's storage bill
// forever. Shrink once, on the way in.

const MAX_EDGE = 1400
const QUALITY = 0.82
// Below this, re-encoding costs quality for no meaningful saving.
const LEAVE_ALONE_BYTES = 400 * 1024

/**
 * Returns a Blob to upload — either a downscaled JPEG or the original file
 * when it is already small. Throws with a readable message on anything that
 * is not a decodable image (HEIC from an iPhone can land here if the browser
 * did not convert it).
 */
export async function downscaleImage(file, maxEdge = MAX_EDGE, quality = QUALITY) {
  if (!file?.type?.startsWith('image/')) {
    throw new Error('That file is not an image.')
  }

  let bitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    throw new Error('That image could not be read. Try exporting it as a JPEG or PNG first.')
  }

  const longest = Math.max(bitmap.width, bitmap.height)
  const scale = Math.min(1, maxEdge / longest)

  if (scale === 1 && file.size <= LEAVE_ALONE_BYTES) {
    bitmap.close?.()
    return file
  }

  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  // Posters are photographic; JPEG has no alpha, so fill first or transparent
  // PNGs come out with black edges.
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, width, height)
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close?.()

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Could not process that image.'))),
      'image/jpeg',
      quality
    )
  })
  return blob
}
