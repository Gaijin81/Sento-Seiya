import { CHAPTER_ONE } from './chapter1'
import { CHAPTER_TWO } from './chapter2'
import { CHAPTER_THREE } from './chapter3'
import type { Chapter } from './types'

/** Playable chapters, in order: each one unlocks once the previous one has been cleared. */
export const CHAPTERS: Chapter[] = [CHAPTER_ONE, CHAPTER_TWO, CHAPTER_THREE]

export const getChapter = (id: string) => CHAPTERS.find((chapter) => chapter.id === id)

export function isChapterUnlocked(id: string, clearedIds: string[]): boolean {
  const index = CHAPTERS.findIndex((chapter) => chapter.id === id)
  return index === 0 || (index > 0 && clearedIds.includes(CHAPTERS[index - 1].id))
}
