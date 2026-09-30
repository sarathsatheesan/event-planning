// Shapes and rules for artist rosters and bio documents.
//
// Kept out of the components so the dialog, the comparison table and the PDF
// all read a roster the same way — including the older shape, below.

export const MAX_ARTISTS = 20

/**
 * Grouped so a long list stays navigable in a dropdown. Weighted towards what
 * an ICC programme actually books; "Other" is the escape hatch rather than an
 * invitation to type anything, which would make the column unsortable noise.
 */
export const INSTRUMENT_GROUPS = [
  { label: 'Voice', options: ['Vocals — Carnatic', 'Vocals — Hindustani', 'Vocals — Film', 'Chorus'] },
  {
    label: 'Percussion',
    options: ['Tabla', 'Mridangam', 'Ghatam', 'Kanjira', 'Dholak', 'Dhol', 'Drums', 'Percussion — other'],
  },
  { label: 'Strings', options: ['Violin', 'Veena', 'Sitar', 'Sarod', 'Santoor', 'Guitar', 'Bass'] },
  { label: 'Wind', options: ['Flute — Bansuri', 'Nadaswaram', 'Shehnai', 'Saxophone'] },
  { label: 'Keys', options: ['Harmonium', 'Keyboard'] },
  {
    label: 'Dance',
    options: [
      'Bharatanatyam',
      'Kathak',
      'Kuchipudi',
      'Mohiniyattam',
      'Odissi',
      'Bhangra',
      'Garba / Dandiya',
      'Bollywood',
      'Folk',
    ],
  },
  { label: 'Other', options: ['Narration / MC', 'Sound engineer', 'Lighting', 'Other'] },
]

/**
 * A roster used to be a plain list of names. Anything saved before the
 * instrument selector existed still reads correctly through here, so old
 * records do not have to be migrated or lost.
 */
export function normaliseRoster(roster) {
  if (!Array.isArray(roster)) return []
  return roster.map((entry) =>
    typeof entry === 'string'
      ? { name: entry, instruments: [] }
      : {
          name: entry?.name ?? '',
          instruments: Array.isArray(entry?.instruments) ? entry.instruments : [],
        }
  )
}

/** "Meera Krishnan (Vocals — Carnatic), Arjun Rao (Tabla)" for tables and PDFs. */
export function rosterSummary(roster) {
  return normaliseRoster(roster)
    .filter((a) => a.name)
    .map((a) => (a.instruments.length ? `${a.name} (${a.instruments.join(', ')})` : a.name))
    .join(', ')
}

// ------------------------------------------------------------ bio documents

const BIO_TYPES = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
}

export const BIO_ACCEPT = '.pdf,.doc,.docx'
export const MAX_BIO_BYTES = 10 * 1024 * 1024

function extensionOf(name) {
  return (name?.split('.').pop() ?? '').toLowerCase()
}

/** Null when the file is acceptable, otherwise the message to show. */
export function checkBioFile(file) {
  if (!file) return 'Choose a file.'
  if (!(extensionOf(file.name) in BIO_TYPES)) {
    return 'Bios must be a PDF, DOC or DOCX file.'
  }
  if (file.size > MAX_BIO_BYTES) {
    return `That file is ${formatBytes(file.size)}. The limit is ${formatBytes(MAX_BIO_BYTES)}.`
  }
  return null
}

/**
 * Browsers report .doc inconsistently — sometimes an empty string — and the
 * storage rules match on an exact list, so the type is decided here from the
 * extension rather than trusted from the file object.
 */
export function bioContentType(file) {
  return BIO_TYPES[extensionOf(file.name)] ?? 'application/octet-stream'
}

export function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
