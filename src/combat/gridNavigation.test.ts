import { describe, expect, it } from 'vitest'
import { nextGridCell } from './gridNavigation'

describe('grid keyboard navigation', () => {
  it('moves with the arrows and stays inside the board', () => {
    expect(nextGridCell({ x: 2, y: 2 }, 'ArrowUp', 7, 5)).toEqual({ x: 2, y: 1 })
    expect(nextGridCell({ x: 2, y: 2 }, 'ArrowRight', 7, 5)).toEqual({ x: 3, y: 2 })
    expect(nextGridCell({ x: 0, y: 0 }, 'ArrowLeft', 7, 5)).toEqual({ x: 0, y: 0 })
    expect(nextGridCell({ x: 6, y: 4 }, 'ArrowDown', 7, 5)).toEqual({ x: 6, y: 4 })
  })

  it('jumps to the row edges and ignores other keys', () => {
    expect(nextGridCell({ x: 3, y: 1 }, 'Home', 7, 5)).toEqual({ x: 0, y: 1 })
    expect(nextGridCell({ x: 3, y: 1 }, 'End', 7, 5)).toEqual({ x: 6, y: 1 })
    expect(nextGridCell({ x: 3, y: 1 }, 'Enter', 7, 5)).toBeNull()
  })
})
