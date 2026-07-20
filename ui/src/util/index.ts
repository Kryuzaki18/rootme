export function stripExeSuffix(imageName: string): string {
  return imageName.replace(/\.exe$/i, '')
}

export function initials(text: string): string {
  return text.trim().slice(0, 2).toUpperCase() || '??'
}
