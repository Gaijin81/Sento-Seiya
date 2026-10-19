import { useState } from 'react'
import { createInitialProgression, loadProgression, type ProgressionState } from './combat/progression'
import CombatArena from './combat/CombatArena'
import {
  Swords, Shield, Sparkles, Users, Map, ScrollText, Trophy,
  ChevronRight, Flame, Star, CircleHelp, Menu, X, Heart, Zap,
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

const roster = [
  { name: 'Seiya', title: 'Chevalier de Pégase', level: 1, cosmos: 72, color: 'coral', initials: '天' },
  { name: 'Shiryu', title: 'Chevalier du Dragon', level: 1, cosmos: 68, color: 'jade', initials: '龍' },
  { name: 'Hyoga', title: 'Chevalier du Cygne', level: 1, cosmos: 65, color: 'ice', initials: '白' },
]

type Section = 'Campagne' | 'Équipe' | 'Arènes' | 'Combat' | 'Codex'

export default function App() {
  const [activeSection, setActiveSection] = useState<Section>('Campagne')
  const [selectedCampaign, setSelectedCampaign] = useState(0)
  const [showRoster, setShowRoster] = useState(false)
  const [mobileMenu, setMobileMenu] = useState(false)
  const [notice, setNotice] = useState('')
  const [progression, setProgression] = useState<ProgressionState>(() => {
    if (typeof window === 'undefined') return createInitialProgression()
    return loadProgression(window.localStorage)
  })

  const startCampaign = () => {
    setNotice(`Aventure sélectionnée : ${campaigns[selectedCampaign].title}. Le moteur de combat sera ajouté dans une prochaine fonctionnalité.`)
  }

  const navItems: { label: Section; icon: typeof Map }[] = [
    { label: 'Campagne', icon: Map },
    { label: 'Équipe', icon: Users },
    { label: 'Arènes', icon: Swords },
    { label: 'Combat', icon: Flame },
    { label: 'Codex', icon: ScrollText },
  ]

  return (
    <div className="app-shell">
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
            <button key={label} className={`nav-item ${activeSection === label ? 'active' : ''}`} onClick={() => { setActiveSection(label); setMobileMenu(false); setNotice('') }}>
              <Icon size={18} strokeWidth={1.8} /><span>{label}</span>{activeSection === label && <ChevronRight size={16} className="nav-chevron" />}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="cosmos-card">
            <div className="cosmos-icon"><Flame size={19} /></div>
            <div><strong>Éveille ton Cosmos</strong><p>Chaque bataille te rapproche des étoiles.</p></div>
          </div>
          <button className="help-link" onClick={() => setNotice('Le guide du jeu sera disponible avec la fonctionnalité Codex.')}><CircleHelp size={16} /> Guide de l’aventurier</button>
          <div className="version">VERSION 0.1.0 · PROTOTYPE</div>
        </div>
      </aside>

      {mobileMenu && <button className="scrim" aria-label="Fermer le menu" onClick={() => setMobileMenu(false)} />}

      <main className="main-content">
        <header className="topbar">
          <button className="icon-button mobile-menu-button" onClick={() => setMobileMenu(true)} aria-label="Ouvrir le menu"><Menu size={21} /></button>
          <div className="breadcrumb"><span>SANCTUAIRE</span><ChevronRight size={14} /><strong>{activeSection.toUpperCase()}</strong></div>
          <div className="topbar-actions"><div className="resource"><Sparkles size={16} /><strong>0</strong><span>Cosmos</span></div><div className="top-avatar">?</div></div>
        </header>

        {activeSection === 'Campagne' && (
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

            <section className="stats-row" aria-label="Progression">
              <div className="stat-item"><div className="stat-icon gold-icon"><Trophy size={18} /></div><div><span>QUÊTES TERMINÉES</span><strong>0 <small>/ 24</small></strong></div></div>
              <div className="stat-item"><div className="stat-icon violet-icon"><Users size={18} /></div><div><span>CHEVALIERS RECRUTÉS</span><strong>3 <small>/ 88</small></strong></div></div>
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
                <div className="panel-heading"><div><div className="eyebrow">TES ALLIÉS</div><h2>Équipe de départ</h2></div><button className="text-button" onClick={() => setActiveSection('Équipe')}>Gérer <ChevronRight size={15} /></button></div>
                <div className="roster-list">{roster.map((knight) => <div className="roster-row" key={knight.name}><div className={`knight-avatar ${knight.color}`}>{knight.initials}</div><div className="knight-info"><strong>{knight.name}</strong><span>{knight.title}</span></div><div className="knight-level">NIV. {progression.knights.find((entry) => entry.name === knight.name)?.level ?? knight.level}</div><div className="knight-power"><Zap size={13} /> {knight.cosmos}</div></div>)}</div>
              </div>
              <div className="panel daily-panel"><div className="eyebrow">DÉFI DU JOUR</div><div className="daily-symbol"><Sparkles size={26} /></div><h3>Le premier éveil</h3><p>Découvre ton équipe et sélectionne ton premier arc d’aventure.</p><div className="daily-reward"><span>RÉCOMPENSE</span><strong><Sparkles size={15} /> +50 XP</strong></div><button className="secondary-button" onClick={() => { setShowRoster(!showRoster); setNotice(showRoster ? '' : 'Défi consulté : découvre ton équipe de départ.') }}>{showRoster ? 'Masquer le détail' : 'Voir le défi'} <ChevronRight size={15} /></button>{showRoster && <div className="challenge-note">Défi de découverte · Progression sauvegardée localement dans cette session uniquement.</div>}</div>
            </section>
          </>
        )}

        {activeSection === 'Équipe' && <section className="page-section"><div className="eyebrow">TES ALLIÉS · TON DESTIN</div><h1>Les chevaliers</h1><p className="page-intro">Construis une équipe complémentaire. Chaque chevalier possède ses propres statistiques et affinités.</p><div className="roster-page-grid">{roster.map((knight) => <article className="knight-detail" key={knight.name}><div className={`knight-portrait ${knight.color}`}>{knight.initials}</div><div className="eyebrow">CHEVALIER DE BRONZE</div><h2>{knight.name}</h2><p>{knight.title}</p><div className="detail-stat"><span>Niveau</span><strong>{progression.knights.find((entry) => entry.name === knight.name)?.level ?? knight.level}</strong></div><div className="detail-stat"><span>Puissance du Cosmos</span><strong>{knight.cosmos} PC</strong></div><div className="mini-track"><span style={{ width: `${knight.cosmos}%` }} /></div><button className="secondary-button" onClick={() => setNotice(`${knight.name} : fiche détaillée et progression à venir.`)}>Consulter la fiche <ChevronRight size={15} /></button></article>)}</div></section>}

        {activeSection === 'Arènes' && <section className="page-section"><div className="eyebrow">COMBAT · HONNEUR · STRATÉGIE</div><h1>Les arènes</h1><p className="page-intro">Prépare-toi aux combats tactiques, aux défis contre l’IA et aux affrontements entre joueurs.</p><div className="arena-grid"><article className="arena-card"><div className="arena-icon"><Swords size={28} /></div><span className="campaign-subtitle">SOLO · PVE</span><h2>Épreuve du Sanctuaire</h2><p>Affronte une série d’adversaires contrôlés par l’IA et teste ta stratégie.</p><button className="secondary-button arena-launch" onClick={() => setActiveSection('Combat')}><Swords size={15} /> Lancer un combat <ChevronRight size={15} /></button></article><article className="arena-card"><div className="arena-icon violet-icon"><Shield size={28} /></div><span className="campaign-subtitle">DUEL · PVP</span><h2>Défi des chevaliers</h2><p>Compare tes équipes et mesure ta maîtrise du Cosmos contre d’autres joueurs.</p><span className="coming-soon">MULTIJOUEUR À VENIR</span></article><article className="arena-card"><div className="arena-icon jade-icon"><Users size={28} /></div><span className="campaign-subtitle">COOPÉRATION</span><h2>Alliance des héros</h2><p>Unis tes forces avec d’autres joueurs pour vaincre des boss redoutables.</p><span className="coming-soon">COOP À VENIR</span></article></div></section>}

        {activeSection === 'Combat' && <CombatArena onBack={() => setActiveSection('Arènes')} onProgressionChanged={setProgression} />}

        {activeSection === 'Codex' && <section className="page-section"><div className="eyebrow">ARCHIVES · MYTHES · LÉGENDES</div><h1>Codex du Cosmos</h1><p className="page-intro">Le codex rassemblera les chevaliers, les armures, les factions, les lieux et les récits découverts durant tes aventures.</p><div className="codex-grid"><article><Shield size={24} /><h2>Armures sacrées</h2><p>Bronze, Argent, Or et armures légendaires.</p></article><article><Star size={24} /><h2>Chevaliers & factions</h2><p>Personnages, affiliations, techniques et liens.</p></article><article><Map size={24} /><h2>Atlas des royaumes</h2><p>Sanctuaire, Asgard, royaume sous-marin et au-delà.</p></article><article><ScrollText size={24} /><h2>Chroniques</h2><p>Arcs narratifs et chronologie des aventures.</p></article></div><p className="rights-note">Les contenus officiels, images, musiques et noms associés à la licence restent soumis aux droits de leurs ayants droit. Ce prototype utilise une interface originale et des éléments textuels provisoires.</p></section>}

        {notice && <div className="notice" role="status"><Sparkles size={17} /><span>{notice}</span><button onClick={() => setNotice('')} aria-label="Fermer le message"><X size={16} /></button></div>}
        <footer className="footer"><span>SENTO SEIYA <i>·</i> CHRONIQUES DU COSMOS</span><span>UN PROTOTYPE EN CONSTRUCTION</span></footer>
      </main>
    </div>
  )
}
