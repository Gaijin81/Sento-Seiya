import { useEffect, useState } from 'react'
import { parseProgression, VICTORY_STARDUST, createInitialProgression, loadProgression, MAX_SQUAD_SIZE, saveProgression, xpRequiredForNextLevel, type ProgressionState } from './combat/progression'
import { createKnightUnit, getKnightDefinition, knightStatsAtLevel, type KnightDefinition } from './combat/knights'
import { getRecruitableKnights, getRecruitStatus, recruitKnight, toggleSquadMember, type ProgressionResult } from './combat/recruitment'
import CombatArena from './combat/CombatArena'
import { DIFFICULTIES, DIFFICULTY_INFO, loadAdaptive, loadDifficulty, MAX_ADAPTIVE_GAP, saveAdaptive, saveDifficulty, type Difficulty } from './combat/difficulty'
import { audio, THEME_LABELS, THEMES, type Theme } from './audio/engine'
import { loadAudioSettings, saveAudioSettings, type AudioSettings } from './audio/settings'
import { activatePacks, installPack, loadInstalledPacks, saveInstalledPacks, uninstallPack, type ContentPack } from './dlc/manifest'
import { EXAMPLE_PACK } from './dlc/examplePack'
import { applyEquipment, availableCount, forgeLevel, MAX_FORGE_LEVEL, requiredChapterLabel, upgradeCost, upgradedBonus, upgradeItem, bonusLabel, allItems, equipItem, EQUIPMENT_SLOTS, isForgeable, RARITY_LABELS, forgeItem, getItem, ownedCount, SLOT_LABELS, unequipItem } from './combat/equipment'
import CampaignBoard from './campaign/CampaignBoard'
import CodexPage from './codex/CodexPage'
import LocalVersus from './versus/LocalVersus'
import type { LocalMode } from './versus/match'
import { CHAPTERS, getChapter, isChapterUnlocked } from './campaign/chapters'
import { ENCOUNTERS } from './campaign/encounters'
import { chooseOption, createCampaign, loadCampaign, pendingEncounter, resolveEncounter, saveCampaign, type CampaignResult } from './campaign/engine'
import type { CampaignState } from './campaign/types'
import {
  Swords, Shield, Sparkles, Users, Map, ScrollText, Trophy,
  ChevronRight, Flame, Star, CircleHelp, Menu, X, Heart, Zap,
  Hammer,
  Package,
  Settings,
  Trash2,
  Upload,
  Volume2,
  VolumeX,
  BookOpen,
  Lock,
} from 'lucide-react'

type Campaign = {
  title: string
  subtitle: string
  chapter: string
  level: string
  progress: number
  accent: string
  description: string
}

const campaigns: Campaign[] = [
  {
    title: 'Le Tournoi Galactique',
    subtitle: 'ARC I · LE COMMENCEMENT',
    chapter: 'Les Galaxian Wars',
    level: 'Niveau conseillé : 1–5',
    progress: 0,
    accent: 'gold',
    description: 'Rassemble les premiers chevaliers de bronze et entre dans l’arène. Chaque combat révèle une nouvelle facette du Cosmos.',
  },
  {
    title: 'La Bataille du Sanctuaire',
    subtitle: 'ARC II · LES DOUZE MAISONS',
    chapter: 'Les marches du Sanctuaire',
    level: 'Niveau conseillé : 6–20',
    progress: 0,
    accent: 'violet',
    description: 'Traverse les douze maisons du zodiaque, affronte les chevaliers d’or et découvre la vérité derrière le Grand Pope.',
  },
  {
    title: 'Les Guerriers Divins',
    subtitle: 'ARC III · ASGARD',
    chapter: 'Le royaume des glaces',
    level: 'Niveau conseillé : 12–25',
    progress: 0,
    accent: 'ice',
    description: 'Un royaume gelé, des armures légendaires et un destin lié aux étoiles du Nord t’attendent au-delà des mers.',
  },
]

const recruitLabels = {
  available: 'Recruter',
  insufficient: 'Éclats insuffisants',
  locked: 'Verrouillé',
  owned: 'Recruté',
} as const

type Section = 'Campagne' | 'Équipe' | 'Arènes' | 'Combat' | 'Codex' | 'Partie locale' | 'Options'

const BOOT_PACKS: ContentPack[] = (() => {
  if (typeof window === 'undefined') return []
  const packs = loadInstalledPacks(window.localStorage)
  audio.setOverrides(activatePacks(packs))
  return packs
})()

export default function App() {
  const [activeSection, setActiveSection] = useState<Section>('Campagne')
  const [selectedCampaign, setSelectedCampaign] = useState(0)
  const [showRoster, setShowRoster] = useState(false)
  const [mobileMenu, setMobileMenu] = useState(false)
  const [notice, setNotice] = useState('')
  const [progression, setProgression] = useState<ProgressionState>(() => {
    if (typeof window === 'undefined') return createInitialProgression()
    try { return loadProgression(window.localStorage) } catch { return createInitialProgression() }
  })

  const commitProgression = (next: ProgressionState): boolean => {
    setProgression(next)
    try {
      if (typeof window !== 'undefined') saveProgression(window.localStorage, next)
      return true
    } catch {
      return false
    }
  }

  const [campaign, setCampaign] = useState<CampaignState>(() => {
    if (typeof window === 'undefined') return createCampaign(CHAPTERS[0])
    try { return loadCampaign(window.localStorage, CHAPTERS[0]) } catch { return createCampaign(CHAPTERS[0]) }
  })
  const chapter = getChapter(campaign.chapterId) ?? CHAPTERS[0]
  const campaignStates = CHAPTERS.map((entry) => {
    if (entry.id === campaign.chapterId) return campaign
    try { return typeof window === 'undefined' ? createCampaign(entry) : loadCampaign(window.localStorage, entry) } catch { return createCampaign(entry) }
  })
  const clearedChapters = campaignStates.filter((state) => state.cleared).map((state) => state.chapterId)
  const [campaignOutcome, setCampaignOutcome] = useState('')
  const [campaignFight, setCampaignFight] = useState<string | null>(null)
  const [localMode, setLocalMode] = useState<LocalMode>('pvp')
  const [audioSettings, setAudioSettings] = useState<AudioSettings>(() => (typeof window === 'undefined' ? loadAudioSettings({ getItem: () => null, setItem: () => undefined }) : loadAudioSettings(window.localStorage)))
  const [packs, setPacks] = useState<ContentPack[]>(() => BOOT_PACKS)
  const [packErrors, setPackErrors] = useState<string[]>([])
  const [difficulty, setDifficulty] = useState<Difficulty>(() => (typeof window === 'undefined' ? 'normal' : loadDifficulty(window.localStorage)))
  const [adaptive, setAdaptive] = useState(() => (typeof window === 'undefined' ? true : loadAdaptive(window.localStorage)))
  const changeAdaptive = (next: boolean) => {
    setAdaptive(next)
    try { saveAdaptive(window.localStorage, next) } catch { /* setting stays in memory */ }
    setNotice(`Difficulté progressive ${next ? 'activée' : 'désactivée'}.`)
  }
  const changeDifficulty = (next: Difficulty) => {
    setDifficulty(next)
    try { saveDifficulty(window.localStorage, next) } catch { /* setting stays in memory */ }
    setNotice(`Difficulté : ${DIFFICULTY_INFO[next].label}.`)
  }

  const theme: Theme = activeSection === 'Combat' || activeSection === 'Partie locale' || (activeSection === 'Campagne' && campaignFight) ? 'battle' : activeSection === 'Campagne' ? 'campaign' : 'menu'
  useEffect(() => { audio.playTheme(theme) }, [theme])
  useEffect(() => {
    audio.configure(audioSettings)
    try { saveAudioSettings(window.localStorage, audioSettings) } catch { /* settings stay in memory */ }
  }, [audioSettings])
  useEffect(() => {
    const unlock = () => audio.unlock()
    window.addEventListener('pointerdown', unlock)
    window.addEventListener('keydown', unlock)
    return () => { window.removeEventListener('pointerdown', unlock); window.removeEventListener('keydown', unlock) }
  }, [])

  const updatePacks = (next: ContentPack[], message: string) => {
    setPacks(next)
    audio.setOverrides(activatePacks(next))
    try { saveInstalledPacks(window.localStorage, next) } catch { /* packs stay in memory */ }
    const cleaned = parseProgression(progression)
    if (cleaned) commitProgression(cleaned)
    setPackErrors([])
    setNotice(message)
  }
  const installRawPack = (raw: unknown) => {
    const result = installPack(packs, raw)
    if (!result.ok) { setPackErrors(result.errors); setNotice('Pack refusé : voir les erreurs dans Options.'); return }
    updatePacks(result.packs, `Pack « ${result.pack.name} » installé.`)
  }
  const importPackFile = async (file: File | undefined) => {
    if (!file) return
    if (file.size > 50_000) { setPackErrors(['Fichier trop volumineux (50 Ko maximum).']); return }
    try { installRawPack(JSON.parse(await file.text())) } catch { setPackErrors(['Le fichier n’est pas un JSON valide.']) }
  }
  const openLocal = (mode: LocalMode) => { setLocalMode(mode); setActiveSection('Partie locale') }

  const selectChapter = (id: string) => {
    const next = getChapter(id)
    if (!next || next.id === campaign.chapterId || !isChapterUnlocked(id, clearedChapters)) return
    try { setCampaign(loadCampaign(window.localStorage, next)) } catch { setCampaign(createCampaign(next)) }
    setCampaignOutcome('')
    setCampaignFight(null)
  }

  const commitCampaign = (next: CampaignState) => {
    setCampaign(next)
    try { if (typeof window !== 'undefined') saveCampaign(window.localStorage, next) } catch { /* progress stays in memory */ }
  }

  const applyCampaign = (result: CampaignResult) => {
    if (!result.ok) {
      setNotice(result.error)
      return
    }
    commitCampaign(result.state)
    if (result.progression !== progression) commitProgression(result.progression)
    setCampaignOutcome(result.outcome)
    setCampaignFight(result.encounter ?? null)
  }

  const applyResult = (result: ProgressionResult, success: string) => {
    if (!result.ok) {
      setNotice(result.error)
      return
    }
    const saved = commitProgression(result.progression)
    setNotice(saved ? success : success + ' Attention : le navigateur a bloqué la sauvegarde locale.')
  }

  const ownedKnights = progression.knights.flatMap((knight) => {
    const definition = getKnightDefinition(knight.id)
    return definition ? [{ knight, definition }] : []
  })
  const squadKnights = progression.squad.flatMap((id) => ownedKnights.filter((entry) => entry.knight.id === id))
  const recruitable = getRecruitableKnights(progression)

  const startCampaign = () => {
    setNotice(selectedCampaign === 0 ? '' : `Aventure sélectionnée : ${campaigns[selectedCampaign].title}. Cet arc sera ajouté dans un prochain chapitre ; le chapitre 1 est jouable.`)
    document.getElementById('campaign-board')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  useEffect(() => {
    if (!mobileMenu) return
    const closeOnEscape = (event: globalThis.KeyboardEvent) => { if (event.key === 'Escape') setMobileMenu(false) }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [mobileMenu])

  const upgradeButton = (item: ReturnType<typeof allItems>[number]) => {
    if (ownedCount(progression, item.id) < 1) return null
    const level = forgeLevel(progression, item.id)
    if (level >= MAX_FORGE_LEVEL) return <span className="forge-level max">Niveau {level}/{MAX_FORGE_LEVEL} · maximum</span>
    return <button className="secondary-button" disabled={progression.stardust < upgradeCost(level)} onClick={() => applyResult(upgradeItem(progression, item.id), `${item.name} passe au niveau ${level + 1} !`)} aria-label={`Améliorer ${item.name}, niveau ${level} sur ${MAX_FORGE_LEVEL}, coût ${upgradeCost(level)}`}><Hammer size={14} /> Niv. {level}/{MAX_FORGE_LEVEL} · Améliorer · {upgradeCost(level)}</button>
  }

  const navItems: { label: Section; icon: typeof Map }[] = [
    { label: 'Campagne', icon: Map },
    { label: 'Équipe', icon: Users },
    { label: 'Arènes', icon: Swords },
    { label: 'Combat', icon: Flame },
    { label: 'Codex', icon: ScrollText },
    { label: 'Options', icon: Settings },
  ]

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Aller au contenu</a>
      <aside className={`sidebar ${mobileMenu ? 'sidebar-open' : ''}`}>
        <div className="brand">
          <div className="brand-mark"><Sparkles size={21} /></div>
          <div><strong>SENTO <span>SEIYA</span></strong><small>CHRONIQUES DU COSMOS</small></div>
          <button className="icon-button close-menu" onClick={() => setMobileMenu(false)} aria-label="Fermer le menu"><X size={20} /></button>
        </div>

        <div className="profile-card">
          <div className="profile-avatar"><Star size={23} fill="currentColor" /></div>
          <div className="profile-info"><strong>Nouvelle légende</strong><span>Rang Bronze · Niveau {Math.floor(progression.playerXp / 100) + 1}</span></div>
          <span className="online-dot" />
          <div className="xp-track"><span style={{ width: ((progression.playerXp % 100) / 100 * 100) + '%' }} /></div>
          <div className="xp-caption"><span>EXPÉRIENCE</span><span>{progression.playerXp % 100} / 100 XP</span></div>
        </div>

        <div className="nav-label">SANCTUAIRE</div>
        <nav className="main-nav" aria-label="Navigation principale">
          {navItems.map(({ label, icon: Icon }) => (
            <button key={label} className={`nav-item ${activeSection === label ? 'active' : ''}`} aria-current={activeSection === label ? 'page' : undefined} onClick={() => { setActiveSection(label); setMobileMenu(false); setNotice('') }}>
              <Icon size={18} strokeWidth={1.8} /><span>{label}</span>{activeSection === label && <ChevronRight size={16} className="nav-chevron" />}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="cosmos-card">
            <div className="cosmos-icon"><Flame size={19} /></div>
            <div><strong>Éveille ton Cosmos</strong><p>Chaque bataille te rapproche des étoiles.</p></div>
          </div>
          <button className="help-link" onClick={() => { setActiveSection('Codex'); setMobileMenu(false) }}><CircleHelp size={16} /> Guide de l’aventurier</button>
          <div className="version">VERSION 0.1.0 · PROTOTYPE</div>
        </div>
      </aside>

      {mobileMenu && <button className="scrim" aria-label="Fermer le menu" onClick={() => setMobileMenu(false)} />}

      <main className="main-content" id="main-content" tabIndex={-1}>
        <header className="topbar">
          <button className="icon-button mobile-menu-button" onClick={() => setMobileMenu(true)} aria-label="Ouvrir le menu"><Menu size={21} /></button>
          <div className="breadcrumb"><span>SANCTUAIRE</span><ChevronRight size={14} /><strong>{activeSection.toUpperCase()}</strong></div>
          <div className="topbar-actions"><button className="icon-button sound-toggle" onClick={() => setAudioSettings({ ...audioSettings, muted: !audioSettings.muted })} aria-label={audioSettings.muted ? 'Activer le son' : 'Couper le son'} aria-pressed={audioSettings.muted}>{audioSettings.muted ? <VolumeX size={18} /> : <Volume2 size={18} />}</button><div className="resource" aria-label="Éclats de Cosmos"><Sparkles size={16} /><strong>{progression.cosmosShards}</strong><span>Éclats</span></div><div className="top-avatar">?</div></div>
        </header>

        {activeSection === 'Campagne' && campaignFight && ENCOUNTERS[campaignFight] && (
          <CombatArena
            key={campaignFight}
            difficulty={difficulty}
            adaptive={adaptive}
            progression={progression}
            onProgressionChanged={commitProgression}
            encounter={ENCOUNTERS[campaignFight]}
            backLabel="Retour à la campagne"
            onBack={() => setCampaignFight(null)}
            onEditSquad={() => setActiveSection('Équipe')}
            onCombatEnd={(victory) => applyCampaign(resolveEncounter(chapter, campaign, progression, victory))}
          />
        )}

        {activeSection === 'Campagne' && !(campaignFight && ENCOUNTERS[campaignFight]) && (
          <>
            <section className="hero">
              <div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" />
              <div className="hero-copy">
                <div className="eyebrow"><span className="eyebrow-line" /> LÉGENDE · DESTIN · COSMOS</div>
                <h1>Le destin appartient<br />à ceux qui <em>brûlent</em>.</h1>
                <p>Éveille ton Cosmos. Rassemble tes chevaliers.<br className="desktop-break" /> Écris une légende que même les dieux retiendront.</p>
                <button className="primary-button" onClick={() => { setSelectedCampaign(0); startCampaign() }}><Swords size={17} /> Commencer l’aventure <ChevronRight size={17} /></button>
              </div>
              <div className="hero-art" aria-hidden="true">
                <div className="hero-sun" /><div className="hero-star star-a">✦</div><div className="hero-star star-b">✧</div><div className="hero-star star-c">✦</div>
                <div className="constellation constellation-a" /><div className="constellation constellation-b" />
                <div className="hero-emblem"><Shield size={102} strokeWidth={0.8} /><span>天</span></div>
                <div className="hero-art-caption"><span>守護星</span><i /> COSMOS AWAKENED</div>
              </div>
              <div className="hero-index"><span>01</span><i /> 03</div>
            </section>

            <nav className="chapter-picker" aria-label="Chapitres">{CHAPTERS.map((entry, index) => {
              const unlocked = isChapterUnlocked(entry.id, clearedChapters)
              return (
                <button key={entry.id} className={`chapter-tab ${entry.id === chapter.id ? 'active' : ''}`} aria-pressed={entry.id === chapter.id} disabled={!unlocked} onClick={() => selectChapter(entry.id)}>
                  {unlocked ? <BookOpen size={14} /> : <Lock size={14} />} <span>{entry.title}</span>
                  <small>{clearedChapters.includes(entry.id) ? 'Terminé' : unlocked ? 'En cours' : `Termine le chapitre ${index} pour débloquer`}</small>
                </button>
              )
            })}</nav>

            <CampaignBoard
              chapter={chapter}
              state={campaign}
              progression={progression}
              outcome={campaignOutcome}
              onChoose={(choiceId) => { audio.sfx('select'); applyCampaign(chooseOption(chapter, campaign, progression, choiceId)) }}
              onResumeCombat={() => setCampaignFight(pendingEncounter(chapter, campaign) ?? null)}
              onRetreat={() => applyCampaign(resolveEncounter(chapter, campaign, progression, false))}
              onRestart={() => { commitCampaign(createCampaign(chapter, campaign.rewarded, campaign.cleared)); setCampaignOutcome('') }}
            />

            <section className="stats-row" aria-label="Progression">
              <div className="stat-item"><div className="stat-icon gold-icon"><Trophy size={18} /></div><div><span>QUÊTES TERMINÉES</span><strong>0 <small>/ 24</small></strong></div></div>
              <div className="stat-item"><div className="stat-icon violet-icon"><Users size={18} /></div><div><span>CHEVALIERS RECRUTÉS</span><strong>{progression.knights.length} <small>/ 88</small></strong></div></div>
              <div className="stat-item"><div className="stat-icon coral-icon"><Zap size={18} /></div><div><span>PUISSANCE DU COSMOS</span><strong>205 <small>PC</small></strong></div></div>
              <div className="stat-item"><div className="stat-icon jade-icon"><Heart size={18} /></div><div><span>LIEN D’ÉQUIPE</span><strong>Débutant</strong></div></div>
            </section>

            <section className="section-block campaign-section">
              <div className="section-heading"><div><div className="eyebrow">TON HISTOIRE COMMENCE ICI</div><h2>Choisis ta destinée</h2></div><button className="text-button" onClick={() => setNotice('Les arcs suivants seront ajoutés au fil du développement.')}>Tous les arcs <ChevronRight size={15} /></button></div>
              <div className="campaign-grid">
                {campaigns.map((campaign, index) => (
                  <button key={campaign.title} className={`campaign-card ${campaign.accent} ${selectedCampaign === index ? 'selected' : ''}`} onClick={() => { setSelectedCampaign(index); setNotice('') }}>
                    <div className="campaign-art"><div className="campaign-glyph">{index === 0 ? '獅' : index === 1 ? '♌' : '❄'}</div><div className="campaign-number">0{index + 1}</div><div className="campaign-stars">✦　✧　✦</div></div>
                    <div className="campaign-body"><span className="campaign-subtitle">{campaign.subtitle}</span><h3>{campaign.title}</h3><p>{campaign.description}</p><div className="campaign-meta"><span>{campaign.level}</span><span><ChevronRight size={15} /></span></div><div className="campaign-progress"><span style={{ width: `${campaign.progress}%` }} /></div></div>
                    {selectedCampaign === index && <div className="selected-ribbon"><Star size={11} fill="currentColor" /> SÉLECTIONNÉ</div>}
                  </button>
                ))}
              </div>
            </section>

            <section className="section-block lower-grid">
              <div className="panel team-panel">
                <div className="panel-heading"><div><div className="eyebrow">TES ALLIÉS</div><h2>Escouade active</h2></div><button className="text-button" onClick={() => setActiveSection('Équipe')}>Gérer <ChevronRight size={15} /></button></div>
                <div className="roster-list">{squadKnights.map(({ knight, definition }) => <div className="roster-row" key={knight.id}><div className={`knight-avatar ${definition.color}`}>{definition.glyph}</div><div className="knight-info"><strong>{definition.name}</strong><span>{definition.title}</span></div><div className="knight-level">NIV. {knight.level}</div><div className="knight-power"><Zap size={13} /> {knightStatsAtLevel(definition, knight.level).attack}</div></div>)}</div>
              </div>
              <div className="panel daily-panel"><div className="eyebrow">DÉFI DU JOUR</div><div className="daily-symbol"><Sparkles size={26} /></div><h3>Le premier éveil</h3><p>Découvre ton équipe et sélectionne ton premier arc d’aventure.</p><div className="daily-reward"><span>RÉCOMPENSE</span><strong><Sparkles size={15} /> +50 XP</strong></div><button className="secondary-button" onClick={() => { setShowRoster(!showRoster); setNotice(showRoster ? '' : 'Défi consulté : découvre ton équipe de départ.') }}>{showRoster ? 'Masquer le détail' : 'Voir le défi'} <ChevronRight size={15} /></button>{showRoster && <div className="challenge-note">Défi de découverte · Progression sauvegardée localement dans cette session uniquement.</div>}</div>
            </section>
          </>
        )}

        {activeSection === 'Équipe' && (
          <section className="page-section">
            <div className="eyebrow">TES ALLIÉS · TON DESTIN</div>
            <h1>Les chevaliers</h1>
            <p className="page-intro">Compose une escouade de {MAX_SQUAD_SIZE} chevaliers maximum et recrute de nouveaux alliés avec les éclats de Cosmos gagnés en combat.</p>
            <div className="progression-summary squad-summary" aria-label="Ressources de l'équipe"><span><Users size={14} /> ESCOUADE <strong>{progression.squad.length}/{MAX_SQUAD_SIZE}</strong></span><span><Sparkles size={14} /> ÉCLATS DE COSMOS <strong>{progression.cosmosShards}</strong></span><span><Hammer size={14} /> POUSSIÈRES D’ÉTOILES <strong>{progression.stardust}</strong></span><span><Trophy size={14} /> VICTOIRES <strong>{progression.victories}</strong></span></div>
            <div className="roster-page-grid">{ownedKnights.map(({ knight, definition }) => {
              const stats = applyEquipment(createKnightUnit(definition, knight.level), progression.equipment[knight.id], progression.upgrades)
              const inSquad = progression.squad.includes(knight.id)
              return (
                <article className={`knight-detail ${inSquad ? 'in-squad' : ''}`} key={knight.id}>
                  <div className={`knight-portrait ${definition.color}`}>{definition.glyph}</div>
                  <div className="eyebrow">CHEVALIER DE {definition.rank}{inSquad ? ' · ESCOUADE' : ''}</div>
                  <h2>{definition.name}</h2>
                  <p>{definition.title}</p>
                  <div className="detail-stat"><span>Niveau</span><strong>{knight.level}</strong></div>
                  <div className="mini-track"><span style={{ width: `${knight.xp / xpRequiredForNextLevel(knight.level) * 100}%` }} /></div>
                  <div className="detail-stat"><span>XP</span><strong>{knight.xp} / {xpRequiredForNextLevel(knight.level)}</strong></div>
                  <div className="detail-stat"><span>PV · ATQ · DÉF · VIT</span><strong>{stats.maxHp} · {stats.attack} · {stats.defense} · {stats.speed}</strong></div>
                  <div className="detail-stat"><span>{definition.technique.name}</span><strong>{definition.technique.cost} Cosmos</strong></div>
                  <div className="gear-slots">{EQUIPMENT_SLOTS.map((slot) => {
                    const equipped = progression.equipment[knight.id]?.[slot]
                    const options = allItems().filter((item) => item.slot === slot && (item.id === equipped || availableCount(progression, item.id) > 0))
                    return (
                      <label className="gear-slot" key={slot}>
                        <span>{SLOT_LABELS[slot]}</span>
                        <select value={equipped ?? ''} aria-label={`${SLOT_LABELS[slot]} de ${definition.name}`} onChange={(event) => { const itemId = event.target.value; applyResult(itemId ? equipItem(progression, knight.id, itemId) : unequipItem(progression, knight.id, slot), itemId ? `${definition.name} équipe ${getItem(itemId)?.name}.` : `${definition.name} retire son ${SLOT_LABELS[slot].toLowerCase()}.`) }}>
                          <option value="">— Aucun —</option>
                          {options.map((item) => <option key={item.id} value={item.id}>{item.name} ({bonusLabel(item.bonus)})</option>)}
                        </select>
                      </label>
                    )
                  })}</div>
                  <button className="secondary-button" aria-pressed={inSquad} onClick={() => applyResult(toggleSquadMember(progression, knight.id), inSquad ? `${definition.name} quitte l’escouade.` : `${definition.name} rejoint l’escouade.`)}>{inSquad ? 'Retirer de l’escouade' : 'Ajouter à l’escouade'} <ChevronRight size={15} /></button>
                </article>
              )
            })}</div>
            <div className="section-heading recruit-heading"><div><div className="eyebrow">FORGE · POUSSIÈRES D’ÉTOILES</div><h2>Équipement</h2></div><span className="log-count"><Hammer size={13} /> {progression.stardust} poussières</span></div>
            <p className="page-intro">Chaque victoire rapporte {VICTORY_STARDUST} poussières d’étoiles. Forge des objets puis équipe-les (une relique, un talisman et une armure par chevalier), puis améliore-les jusqu’au niveau 3 : leurs bonus s’appliquent en combat.</p>
            <div className="forge-grid">{allItems().filter(isForgeable).map((item) => (
              <article className="panel forge-item" key={item.id}>
                <div className="eyebrow">{SLOT_LABELS[item.slot].toUpperCase()}</div>
                <h3>{item.name}</h3>
                <p>{item.description}</p>
                <strong className="gear-bonus">{bonusLabel(upgradedBonus(item, forgeLevel(progression, item.id)))}</strong>
                <div className="detail-stat"><span>Possédés · libres</span><strong>{ownedCount(progression, item.id)} · {availableCount(progression, item.id)}</strong></div>
                {item.requiresChapter && !clearedChapters.includes(item.requiresChapter)
                  ? <button className="secondary-button" disabled><Lock size={14} /> Termine le chapitre {requiredChapterLabel(item)}</button>
                  : <button className="secondary-button" disabled={progression.stardust < item.cost} onClick={() => applyResult(forgeItem(progression, item.id, clearedChapters), `${item.name} forgé !`)}><Hammer size={14} /> Forger · {item.cost}</button>}
                {upgradeButton(item)}
              </article>
            ))}</div>
            <div className="section-heading recruit-heading"><div><div className="eyebrow">OBJETS RARES · CAMPAGNE</div><h2>Trésors</h2></div><span className="log-count">{allItems().filter((item) => !isForgeable(item) && ownedCount(progression, item.id) > 0).length} / {allItems().filter((item) => !isForgeable(item)).length} trouvés</span></div>
            <p className="page-intro">Les objets rares et légendaires ne se forgent pas : ils se trouvent en campagne, selon tes choix.</p>
            <div className="forge-grid">{allItems().filter((item) => !isForgeable(item)).map((item) => {
              const owned = ownedCount(progression, item.id) > 0
              return (
                <article className={`panel forge-item treasure-item rarity-${item.rarity} ${owned ? '' : 'undiscovered'}`} key={item.id}>
                  <div className="eyebrow">{SLOT_LABELS[item.slot].toUpperCase()} · {RARITY_LABELS[item.rarity ?? 'common'].toUpperCase()}</div>
                  <h3>{owned ? item.name : '???'}</h3>
                  <p>{owned ? item.description : 'Pas encore découvert. Explore la campagne et fais d’autres choix.'}</p>
                  {owned && <strong className="gear-bonus">{bonusLabel(upgradedBonus(item, forgeLevel(progression, item.id)))}</strong>}
                  {owned && <div className="detail-stat"><span>Possédés · libres</span><strong>{ownedCount(progression, item.id)} · {availableCount(progression, item.id)}</strong></div>}
                  {owned && upgradeButton(item)}
                </article>
              )
            })}</div>
            <div className="section-heading recruit-heading"><div><div className="eyebrow">RECRUTEMENT</div><h2>Nouveaux alliés</h2></div><button className="text-button" onClick={() => setActiveSection('Combat')}>Préparer un combat <ChevronRight size={15} /></button></div>
            {recruitable.length === 0 ? <p className="page-intro">Tous les chevaliers disponibles ont rejoint ton équipe.</p> : <div className="roster-page-grid">{recruitable.map((definition: KnightDefinition) => {
              const status = getRecruitStatus(progression, definition)
              return (
                <article className={`knight-detail recruit-card ${status}`} key={definition.id}>
                  <div className={`knight-portrait ${definition.color}`}>{definition.glyph}</div>
                  <div className="eyebrow">CHEVALIER DE {definition.rank}</div>
                  <h2>{definition.name}</h2>
                  <p>{definition.title}</p>
                  <div className="detail-stat"><span>Coût</span><strong>{definition.recruitCost} éclats</strong></div>
                  <div className="detail-stat"><span>Condition</span><strong>{definition.requiredVictories > 0 ? `${definition.requiredVictories} victoire(s)` : 'Aucune'}</strong></div>
                  <div className="detail-stat"><span>PV · ATQ · DÉF · VIT</span><strong>{definition.base.hp} · {definition.base.attack} · {definition.base.defense} · {definition.base.speed}</strong></div>
                  <button className="secondary-button" disabled={status !== 'available'} onClick={() => applyResult(recruitKnight(progression, definition.id), `${definition.name} a rejoint ton équipe !`)}>{recruitLabels[status]} <ChevronRight size={15} /></button>
                </article>
              )
            })}</div>}
          </section>
        )}

        {activeSection === 'Arènes' && <section className="page-section"><div className="eyebrow">COMBAT · HONNEUR · STRATÉGIE</div><h1>Les arènes</h1><p className="page-intro">Prépare-toi aux combats tactiques, aux défis contre l’IA et aux affrontements entre joueurs.</p><div className="arena-grid"><article className="arena-card"><div className="arena-icon"><Swords size={28} /></div><span className="campaign-subtitle">SOLO · PVE</span><h2>Épreuve du Sanctuaire</h2><p>Affronte une série d’adversaires contrôlés par l’IA et teste ta stratégie.</p><button className="secondary-button arena-launch" onClick={() => setActiveSection('Combat')}><Swords size={15} /> Lancer un combat <ChevronRight size={15} /></button></article><article className="arena-card"><div className="arena-icon violet-icon"><Shield size={28} /></div><span className="campaign-subtitle">DUEL · PVP</span><h2>Défi des chevaliers</h2><p>Compare tes équipes et mesure ta maîtrise du Cosmos contre d’autres joueurs.</p><button className="secondary-button arena-launch" onClick={() => openLocal('pvp')}><Swords size={15} /> Duel sur le même appareil <ChevronRight size={15} /></button></article><article className="arena-card"><div className="arena-icon jade-icon"><Users size={28} /></div><span className="campaign-subtitle">COOPÉRATION</span><h2>Alliance des héros</h2><p>Unis tes forces avec d’autres joueurs pour vaincre des boss redoutables.</p><button className="secondary-button arena-launch" onClick={() => openLocal('coop')}><Users size={15} /> Coop sur le même appareil <ChevronRight size={15} /></button></article></div></section>}

        {activeSection === 'Partie locale' && <LocalVersus key={localMode} initialMode={localMode} onBack={() => setActiveSection('Arènes')} />}
        {activeSection === 'Options' && (
          <section className="page-section">
            <div className="eyebrow">SON · CONTENUS ADDITIONNELS</div>
            <h1>Options</h1>
            <div className="options-grid">
              <article className="panel options-wide">
                <div className="panel-heading"><div><div className="eyebrow">COMBATS CONTRE L’IA</div><h2>Difficulté</h2></div><span className="log-count">Arènes et campagne</span></div>
                <div className="difficulty-options" role="radiogroup" aria-label="Difficulté">{DIFFICULTIES.map((entry) => (
                  <button key={entry} role="radio" aria-checked={difficulty === entry} className={`difficulty-option ${difficulty === entry ? 'active' : ''}`} onClick={() => changeDifficulty(entry)}><strong>{DIFFICULTY_INFO[entry].label}</strong><small>{DIFFICULTY_INFO[entry].description}</small></button>
                ))}</div>
                <label className="adaptive-row"><input type="checkbox" checked={adaptive} onChange={(event) => changeAdaptive(event.target.checked)} /><span><strong>Difficulté progressive</strong><small>Quand le niveau moyen de ton escouade dépasse celui prévu pour un combat, les adversaires se renforcent (jusqu’à +{MAX_ADAPTIVE_GAP} niveaux).</small></span></label>
                <p className="control-hint">Les récompenses ne changent pas. Les parties locales (duel et coop) ne sont pas affectées.</p>
              </article>
              <article className="panel">
                <div className="panel-heading"><div><div className="eyebrow">AUDIO</div><h2>Musique et effets</h2></div><button className="secondary-button" aria-pressed={audioSettings.muted} onClick={() => setAudioSettings({ ...audioSettings, muted: !audioSettings.muted })}>{audioSettings.muted ? <VolumeX size={15} /> : <Volume2 size={15} />} {audioSettings.muted ? 'Son coupé' : 'Son activé'}</button></div>
                <label className="volume-row"><span>Musique</span><input type="range" min={0} max={100} step={5} value={audioSettings.music} onChange={(event) => setAudioSettings({ ...audioSettings, music: Number(event.target.value) })} aria-label="Volume de la musique" /><strong>{audioSettings.music} %</strong></label>
                <label className="volume-row"><span>Effets</span><input type="range" min={0} max={100} step={5} value={audioSettings.sfx} onChange={(event) => setAudioSettings({ ...audioSettings, sfx: Number(event.target.value) })} aria-label="Volume des effets" /><strong>{audioSettings.sfx} %</strong></label>
                <button className="text-button" onClick={() => { audio.unlock(); audio.sfx('technique') }}>Tester un effet sonore <ChevronRight size={15} /></button>
                <p className="control-hint">Musiques originales générées par le navigateur, une par ambiance ({THEMES.map((entry) => THEME_LABELS[entry]).join(', ')}). Un pack peut les remplacer par ses propres fichiers. Sur mobile, le son démarre après le premier toucher.</p>
              </article>
              <article className="panel">
                <div className="panel-heading"><div><div className="eyebrow">DLC</div><h2>Packs de contenu</h2></div><span className="log-count">{packs.length} installé(s)</span></div>
                {packs.length === 0 ? <p className="control-hint">Aucun pack installé.</p> : (
                  <ul className="pack-list">{packs.map((pack) => (
                    <li key={pack.id}><Package size={18} /><span><strong>{pack.name}</strong><small>v{pack.version}{pack.author ? ` · ${pack.author}` : ''} · {pack.items.length} objet(s){Object.keys(pack.music).length ? ` · musiques : ${Object.keys(pack.music).map((entry) => THEME_LABELS[entry as Theme]).join(', ')}` : ''}</small>{pack.description && <small>{pack.description}</small>}</span><button className="icon-button" onClick={() => updatePacks(uninstallPack(packs, pack.id), `Pack « ${pack.name} » désinstallé. Ses objets ont été retirés.`)} aria-label={`Désinstaller ${pack.name}`}><Trash2 size={16} /></button></li>
                  ))}</ul>
                )}
                <div className="prep-buttons">
                  <button className="secondary-button" onClick={() => installRawPack(EXAMPLE_PACK)}><Package size={15} /> Installer le pack d’exemple</button>
                  <label className="secondary-button file-button"><Upload size={15} /> Importer un pack (.json)<input type="file" accept="application/json,.json" onChange={(event) => { void importPackFile(event.target.files?.[0]); event.target.value = '' }} /></label>
                </div>
                {packErrors.length > 0 && <ul className="pack-errors" role="alert">{packErrors.map((error) => <li key={error}>{error}</li>)}</ul>}
                <p className="control-hint">Un pack est un fichier JSON validé (format décrit dans les règles du jeu) : objets de forge et musiques. Aucun code n’est exécuté.</p>
              </article>
            </div>
          </section>
        )}
        {activeSection === 'Combat' && <CombatArena difficulty={difficulty} adaptive={adaptive} progression={progression} onProgressionChanged={commitProgression} onBack={() => setActiveSection('Arènes')} onEditSquad={() => setActiveSection('Équipe')} />}

        {activeSection === 'Codex' && <CodexPage progression={progression} campaigns={campaignStates} />}

        {notice && <div className="notice" role="status"><Sparkles size={17} /><span>{notice}</span><button onClick={() => setNotice('')} aria-label="Fermer le message"><X size={16} /></button></div>}
        <footer className="footer"><span>SENTO SEIYA <i>·</i> CHRONIQUES DU COSMOS</span><span>UN PROTOTYPE EN CONSTRUCTION</span></footer>
      </main>
    </div>
  )
}
