// Draws the street cred card as a picture, 1080 by 1350 (the portrait shape chat and social
// apps show without cropping). A canvas cannot use the app's CSS classes, so the colors are
// read from the same tokens in index.css.
import { questStrings } from '../strings'
import type { ShareCred } from './shareCred'

export const CARD_WIDTH = 1080
export const CARD_HEIGHT = 1350

const MARGIN = 84
const FONT = '"Outfit", "Helvetica Neue", Helvetica, Arial, sans-serif'
const PHOTO_HEIGHT = 430
const PHOTO_RADIUS = 36

function token(name: string, fallback: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback
}

/** The largest size, at or under `size`, at which `text` fits in `maxWidth`. */
function fit(context: CanvasRenderingContext2D, text: string, weight: number, size: number, maxWidth: number): number {
  let current = size
  context.font = `${weight} ${current}px ${FONT}`
  while (current > 24 && context.measureText(text).width > maxWidth) {
    current -= 4
    context.font = `${weight} ${current}px ${FONT}`
  }
  return current
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('The photo did not load.'))
    image.src = url
  })
}

/** Draws `image` to fill the box, cropped evenly on the long side, with rounded corners. */
function drawCover(context: CanvasRenderingContext2D, image: HTMLImageElement, x: number, y: number, width: number, height: number) {
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight)
  const sourceWidth = width / scale
  const sourceHeight = height / scale
  context.save()
  context.beginPath()
  context.roundRect(x, y, width, height, PHOTO_RADIUS)
  context.clip()
  context.drawImage(
    image,
    (image.naturalWidth - sourceWidth) / 2,
    (image.naturalHeight - sourceHeight) / 2,
    sourceWidth,
    sourceHeight,
    x,
    y,
    width,
    height,
  )
  context.restore()
}

/**
 * The card as a PNG.
 * @param photoUrl The report photo, when there is one. Pass only a picture that is already on
 *   this device (an object URL): a photo from another site would stop the canvas being saved.
 */
export async function drawShareCard(cred: ShareCred, photoUrl?: string | null): Promise<Blob> {
  const text = questStrings.share
  const ink = token('--color-ink', '#0a0a0a')
  const accent = token('--color-accent', '#ff6700')
  const light = token('--color-on-ink', '#ffffff')
  const soft = 'rgb(255 255 255 / .7)'
  const inner = CARD_WIDTH - MARGIN * 2

  // The card is drawn in the app's own font, so wait for it. If it never loads, the fallbacks do.
  try {
    await Promise.all([document.fonts.load(`700 64px ${FONT}`), document.fonts.load(`500 40px ${FONT}`)])
  } catch {
    // Draw with the fallback fonts.
  }
  let photo: HTMLImageElement | null = null
  if (photoUrl) {
    try {
      photo = await loadImage(photoUrl)
    } catch {
      // The card is still worth sharing without its photo.
    }
  }

  const canvas = document.createElement('canvas')
  canvas.width = CARD_WIDTH
  canvas.height = CARD_HEIGHT
  const context = canvas.getContext('2d')
  if (!context) throw new Error('This browser cannot draw the card.')

  context.fillStyle = ink
  context.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT)
  context.textBaseline = 'alphabetic'
  context.textAlign = 'left'

  // Wordmark, with the accent dot the logo uses.
  context.fillStyle = accent
  context.beginPath()
  context.arc(MARGIN + 22, 126, 22, 0, Math.PI * 2)
  context.fill()
  context.fillStyle = light
  context.font = `700 56px ${FONT}`
  context.fillText(text.wordmark, MARGIN + 64, 146)

  let y = 210
  if (photo) {
    drawCover(context, photo, MARGIN, y, inner, PHOTO_HEIGHT)
    y += PHOTO_HEIGHT + 30
  } else {
    y += 110
  }

  // What was just earned.
  if (cred.earned) {
    y += 78
    context.fillStyle = accent
    context.font = `700 76px ${FONT}`
    const plus = text.cardEarned(cred.earned.points)
    context.fillText(plus, MARGIN, y)
    const plusWidth = context.measureText(plus).width
    context.fillStyle = light
    const reason = text.cardReason(text.reported[cred.earned.category])
    fit(context, reason, 500, 44, inner - plusWidth - 28)
    context.fillText(reason, MARGIN + plusWidth + 28, y - 6)
    y += 44
  }

  // Who.
  y += 92
  context.fillStyle = light
  fit(context, cred.nickname, 700, 84, inner)
  context.fillText(cred.nickname, MARGIN, y)

  // The street cred itself.
  y += 76
  context.fillStyle = soft
  context.font = `500 34px ${FONT}`
  context.fillText(text.cardLabel.toUpperCase(), MARGIN, y)
  const total = String(cred.points)
  const totalSize = fit(context, total, 700, photo ? 170 : 300, inner)
  y += totalSize * 0.88
  context.fillStyle = accent
  context.fillText(total, MARGIN, y)

  // The team.
  y += 78
  context.fillStyle = light
  const place = cred.rank === null ? cred.neighborhood : text.placeRanked(cred.neighborhood, cred.rank)
  fit(context, place, 500, 46, inner)
  context.fillText(place, MARGIN, y)

  // Where to play, pinned to the bottom.
  context.fillStyle = soft
  context.font = `500 38px ${FONT}`
  context.fillText(text.cardFooter, MARGIN, CARD_HEIGHT - 76)

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('The card could not be saved.'))), 'image/png')
  })
}
