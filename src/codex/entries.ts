import { CHAPTERS } from '../campaign/chapters'
import { ENCOUNTERS } from '../campaign/encounters'
import type { CampaignState } from '../campaign/types'
import { allItems, bonusLabel, isForgeable, RARITY_LABELS, SLOT_LABELS } from '../combat/equipment'
import { KNIGHT_CATALOG } from '../combat/knights'
import type { ProgressionState } from '../combat/progression'

export type CodexCategory = 'knights' | 'foes' | 'places' | 'items' | 'chronicles'
export type CodexEntry = { id: string; title: string; subtitle: string; text: string; discovered: boolean; hint: string }
export type CodexSection = { category: CodexCategory; label: string; entries: CodexEntry[] }

export const CODEX_LABELS: Record<CodexCategory, string> = { knights: 'Chevaliers', foes: 'Adversaires', places: 'Lieux', items: 'Objets', chronicles: 'Chroniques' }

/** Everything in the codex is derived from the save: entries unlock as the player recruits, explores and fights. */
export function buildCodex(progression: ProgressionState, campaigns: CampaignState[]): CodexSection[] {
  const stateOf = (chapterId: string) => campaigns.find((state) => state.chapterId === chapterId)
  const visited = (chapterId: string, nodeId: string) => Boolean(stateOf(chapterId)?.visited.includes(nodeId))

  const knights: CodexEntry[] = KNIGHT_CATALOG.map((knight) => ({
    id: knight.id,
    title: `${knight.name} · ${knight.title}`,
    subtitle: `Rang ${knight.rank.toLowerCase()} · Technique : ${knight.technique.name} (portée ${knight.technique.range})`,
    text: `PV ${knight.base.hp} · ATQ ${knight.base.attack} · DÉF ${knight.base.defense} · VIT ${knight.base.speed} · Cosmos ${knight.base.maxCosmos}`,
    discovered: progression.knights.some((entry) => entry.id === knight.id),
    hint: knight.recruitCost ? `À recruter : ${knight.recruitCost} éclats, ${knight.requiredVictories} victoire(s).` : 'Chevalier de départ.',
  }))

  const foes: CodexEntry[] = []
  for (const chapter of CHAPTERS) {
    for (const node of chapter.nodes) {
      for (const choice of node.choices) {
        const encounter = choice.combat ? ENCOUNTERS[choice.combat] : undefined
        if (!encounter) continue
        for (const enemy of encounter.enemies) {
          if (foes.some((entry) => entry.title === enemy.name)) continue
          foes.push({
            id: enemy.id,
            title: enemy.name,
            subtitle: `${encounter.title} · ${chapter.title}`,
            text: `PV ${enemy.maxHp} · ATQ ${enemy.attack} · DÉF ${enemy.defense} · VIT ${enemy.speed}${enemy.technique ? ` · ${enemy.technique.name} (portée ${enemy.technique.range ?? 1})` : ''}`,
            discovered: visited(chapter.id, node.id),
            hint: `Rencontré dans ${chapter.title}.`,
          })
        }
      }
    }
  }

  const places: CodexEntry[] = CHAPTERS.flatMap((chapter) => chapter.nodes.map((node) => ({
    id: node.id,
    title: node.title,
    subtitle: chapter.title,
    text: node.text,
    discovered: visited(chapter.id, node.id),
    hint: `À explorer dans ${chapter.title}.`,
  })))

  const items: CodexEntry[] = allItems().map((item) => ({
    id: item.id,
    title: item.name,
    subtitle: `${SLOT_LABELS[item.slot]} · ${RARITY_LABELS[item.rarity ?? 'common']} · ${bonusLabel(item.bonus)}`,
    text: item.description,
    discovered: isForgeable(item) || progression.inventory.includes(item.id),
    hint: 'Trésor caché dans la campagne.',
  }))

  const chronicles: CodexEntry[] = CHAPTERS.map((chapter) => {
    const state = stateOf(chapter.id)
    const flags = state?.flags.length ? ` Choix marquants : ${state.flags.join(', ')}.` : ''
    return {
      id: chapter.id,
      title: chapter.title,
      subtitle: state?.cleared ? 'Chapitre terminé' : `${state?.visited.length ?? 0}/${chapter.nodes.length} cases explorées`,
      text: `${chapter.nodes.find((node) => node.kind === 'start')?.text ?? ''}${flags}`,
      discovered: Boolean(state && state.visited.length > 1),
      hint: 'Commence ce chapitre pour écrire sa chronique.',
    }
  })

  return [
    { category: 'knights', label: CODEX_LABELS.knights, entries: knights },
    { category: 'foes', label: CODEX_LABELS.foes, entries: foes },
    { category: 'places', label: CODEX_LABELS.places, entries: places },
    { category: 'items', label: CODEX_LABELS.items, entries: items },
    { category: 'chronicles', label: CODEX_LABELS.chronicles, entries: chronicles },
  ]
}
