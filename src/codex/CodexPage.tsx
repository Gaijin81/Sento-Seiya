import { useState } from 'react'
import { Lock } from 'lucide-react'
import type { CampaignState } from '../campaign/types'
import type { ProgressionState } from '../combat/progression'
import { buildCodex, type CodexCategory } from './entries'

type Props = { progression: ProgressionState; campaigns: CampaignState[] }

export default function CodexPage({ progression, campaigns }: Props) {
  const sections = buildCodex(progression, campaigns)
  const [category, setCategory] = useState<CodexCategory>('knights')
  const current = sections.find((section) => section.category === category) ?? sections[0]
  const total = sections.reduce((sum, section) => sum + section.entries.length, 0)
  const found = sections.reduce((sum, section) => sum + section.entries.filter((entry) => entry.discovered).length, 0)

  return (
    <section className="page-section">
      <div className="eyebrow">ARCHIVES · MYTHES · LÉGENDES</div>
      <h1>Codex du Cosmos</h1>
      <p className="page-intro">Chaque chevalier recruté, chaque lieu exploré et chaque trésor trouvé vient enrichir le codex. {found}/{total} entrées découvertes.</p>
      <div className="codex-tabs" role="tablist" aria-label="Catégories du codex">
        {sections.map((section) => (
          <button key={section.category} role="tab" id={`codex-tab-${section.category}`} aria-selected={section.category === current.category} aria-controls="codex-panel" className={`codex-tab ${section.category === current.category ? 'active' : ''}`} onClick={() => setCategory(section.category)}>
            {section.label} <small>{section.entries.filter((entry) => entry.discovered).length}/{section.entries.length}</small>
          </button>
        ))}
      </div>
      <div className="codex-entries" role="tabpanel" id="codex-panel" aria-labelledby={`codex-tab-${current.category}`}>
        {current.entries.map((entry) => entry.discovered ? (
          <article key={entry.id} className="codex-entry">
            <h2>{entry.title}</h2>
            <span className="codex-subtitle">{entry.subtitle}</span>
            <p>{entry.text}</p>
          </article>
        ) : (
          <article key={entry.id} className="codex-entry undiscovered" aria-label="Entrée non découverte">
            <h2><Lock size={14} aria-hidden="true" /> ???</h2>
            <p>{entry.hint}</p>
          </article>
        ))}
      </div>
      <p className="rights-note">Les contenus officiels, images, musiques et noms associés à la licence restent soumis aux droits de leurs ayants droit. Les textes du codex et de la campagne sont originaux.</p>
    </section>
  )
}
