export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsText(file)
  })
}

export function createFileInput(onFile: (file: File) => void): HTMLInputElement {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.jsonl'
  input.addEventListener('change', () => {
    const file = input.files?.[0]
    if (file) onFile(file)
  })
  return input
}

export function handleDragOver(event: React.DragEvent): void {
  event.preventDefault()
  event.stopPropagation()
}

export function handleDrop(
  event: React.DragEvent,
  onFile: (file: File) => void,
): void {
  event.preventDefault()
  event.stopPropagation()
  const file = event.dataTransfer.files[0]
  if (file) onFile(file)
}
