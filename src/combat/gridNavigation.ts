import type { Position } from './types'

/** Keyboard navigation inside the tactical grid (arrow keys, Home/End for the row edges). */
export function nextGridCell(position: Position, key: string, width: number, height: number): Position | null {
  const clamp = (value: number, max: number) => Math.min(max - 1, Math.max(0, value))
  switch (key) {
    case 'ArrowUp': return { x: position.x, y: clamp(position.y - 1, height) }
    case 'ArrowDown': return { x: position.x, y: clamp(position.y + 1, height) }
    case 'ArrowLeft': return { x: clamp(position.x - 1, width), y: position.y }
    case 'ArrowRight': return { x: clamp(position.x + 1, width), y: position.y }
    case 'Home': return { x: 0, y: position.y }
    case 'End': return { x: width - 1, y: position.y }
    default: return null
  }
}
