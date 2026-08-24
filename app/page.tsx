'use client';

import { useMemo, useState } from 'react';

const apps = [
  { name: 'Customer Portal', owner: 'Digital Experience', environment: 'Production', status: 'Healthy', region: 'UK South', updated: '4 min ago' },
  { name: 'Claims Processing', owner: 'Operations', environment: 'Production', status: 'Healthy', region: 'West Europe', updated: '12 min ago' },
  { name: 'Finance Data Hub', owner: 'Finance Platform', environment: 'Staging', status: 'Attention', region: 'UK West', updated: '28 min ago' },
  { name: 'Partner API Gateway', owner: 'Integration Services', environment: 'Production', status: 'Healthy', region: 'North Europe', updated: '1 hr ago' },
];
const nav = ['Overview', 'Applications', 'Deployments', 'Governance', 'Integrations'];

export default function Home() {
  const [active, setActive] = useState('Overview');
  const [query, setQuery] = useState('');
  const [environment, setEnvironment] = useState('All environments');
  const [notice, setNotice] = useState('');
  const [panelOpen, setPanelOpen] = useState(false);
  const filtered = useMemo(() => apps.filter((app) => (`${app.name} ${app.owner}`.toLowerCase().includes(query.toLowerCase())) && (environment === 'All environments' || app.environment === environment)), [query, environment]);
  const act = (message: string) => { setNotice(message); window.setTimeout(() => setNotice(''), 2800); };

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><span className="brand-mark">A</span><div><strong>Azura</strong><small>Enterprise Cloud</small></div></div>
      <nav aria-label="Primary navigation"><p className="nav-label">Workspace</p>{nav.map((item, i) => <button key={item} onClick={() => setActive(item)} className={active === item ? 'nav-item active' : 'nav-item'}><span className="nav-icon">{['⌂','▦','↗','◇','⌁'][i]}</span>{item}{item === 'Governance' && <span className="nav-badge">3</span>}</button>)}</nav>
      <div className="sidebar-bottom"><button className="nav-item" onClick={() => act('Help centre opened')}><span className="nav-icon">?</span>Help & support</button><button className="nav-item" onClick={() => act('Settings opened')}><span className="nav-icon">⚙</span>Settings</button><div className="user"><span className="avatar">AM</span><div><strong>Alex Morgan</strong><small>Cloud Administrator</small></div><span>⋮</span></div></div>
    </aside>
    <main className="main">
      <header className="topbar"><div className="mobile-brand"><span className="brand-mark">A</span><strong>Azura</strong></div><label className="search"><span>⌕</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search applications, resources, people..." aria-label="Search"/><kbd>⌘ K</kbd></label><div className="top-actions"><button aria-label="Notifications" className="icon-btn" onClick={() => act('You have 3 notifications')}>♧<span className="notification-dot"/></button><button className="docs" onClick={() => act('Documentation opened')}>Documentation ↗</button></div></header>
      <div className="content">
        <section className="hero-row"><div><p className="eyebrow">Monday, 24 August</p><h1>{active}</h1><p className="subhead">Monitor your enterprise landscape and keep every Azure workload moving.</p></div><div className="hero-actions"><button className="secondary" onClick={() => act('Report export started')}>⇩ Export report</button><button className="primary" onClick={() => setPanelOpen(true)}>＋ Connect application</button></div></section>
        <section className="metrics" aria-label="Workspace metrics">
          <article><div className="metric-top"><span className="metric-icon blue">▦</span><span className="trend up">↑ 8.2%</span></div><p>Applications</p><strong>24</strong><small>Across 6 business units</small></article>
          <article><div className="metric-top"><span className="metric-icon green">✓</span><span className="trend up">↑ 2.4%</span></div><p>Platform health</p><strong>99.96%</strong><small>Last 30 days</small></article>
          <article><div className="metric-top"><span className="metric-icon violet">↗</span><span className="trend neutral">This month</span></div><p>Deployments</p><strong>142</strong><small>96% successful</small></article>
          <article><div className="metric-top"><span className="metric-icon amber">◇</span><span className="trend warn">3 open</span></div><p>Policy compliance</p><strong>94%</strong><small>7 checks need review</small></article>
        </section>
        <section className="lower-grid">
          <div className="panel applications"><div className="panel-head"><div><h2>Application landscape</h2><p>Health and governance across connected workloads</p></div><div className="filters"><select value={environment} onChange={(e) => setEnvironment(e.target.value)} aria-label="Environment"><option>All environments</option><option>Production</option><option>Staging</option></select><button onClick={() => setActive('Applications')}>View all</button></div></div><div className="table-wrap"><table><thead><tr><th>Application</th><th>Environment</th><th>Status</th><th>Region</th><th>Last updated</th><th/></tr></thead><tbody>{filtered.map((app, i) => <tr key={app.name}><td><div className={`app-logo l${i}`}>{app.name.split(' ').map(w => w[0]).join('').slice(0,2)}</div><div><strong>{app.name}</strong><small>{app.owner}</small></div></td><td><span className="environment">{app.environment}</span></td><td><span className={app.status === 'Healthy' ? 'status healthy' : 'status attention'}><i/>{app.status}</span></td><td>{app.region}</td><td>{app.updated}</td><td><button className="row-menu" onClick={() => act(`${app.name} actions opened`)}>•••</button></td></tr>)}</tbody></table>{filtered.length === 0 && <div className="empty">No applications match your search.</div>}</div></div>
          <aside className="right-stack"><div className="panel activity"><div className="panel-head"><div><h2>Recent activity</h2><p>Latest changes across your estate</p></div><button onClick={() => act('Activity feed refreshed')}>↻</button></div><div className="timeline"><div><span className="timeline-icon success">✓</span><p><strong>Deployment completed</strong><br/><span>Customer Portal · Production</span><small>8 minutes ago · by Maya Chen</small></p></div><div><span className="timeline-icon azure">↗</span><p><strong>Integration connected</strong><br/><span>Microsoft Entra ID</span><small>42 minutes ago · by Alex Morgan</small></p></div><div><span className="timeline-icon warning">!</span><p><strong>Policy requires attention</strong><br/><span>Finance Data Hub · Encryption</span><small>1 hour ago · Azure Policy</small></p></div></div><button className="activity-link" onClick={() => act('Full activity opened')}>View all activity →</button></div><div className="insight"><div className="insight-mark">✦</div><div><p>AZURE ADVISOR INSIGHT</p><h3>Reduce monthly cloud spend by an estimated <strong>£2,840</strong></h3><button onClick={() => act('Cost recommendations opened')}>View recommendations →</button></div></div></aside>
        </section>
      </div>
    </main>
    {panelOpen && <div className="overlay" onMouseDown={() => setPanelOpen(false)}><section className="drawer" onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="connect-title"><button className="close" onClick={() => setPanelOpen(false)}>×</button><p className="eyebrow">New connection</p><h2 id="connect-title">Connect an Azure application</h2><p>Register an enterprise workload and bring its health, deployments, and governance into one place.</p><label>Application name<input placeholder="e.g. Employee Experience Hub"/></label><label>Azure subscription<select><option>Production — Contoso UK</option><option>Shared Services</option><option>Development & Test</option></select></label><label>Resource type<select><option>Azure App Service</option><option>Azure Functions</option><option>Azure Kubernetes Service</option><option>API Management</option></select></label><button className="primary full" onClick={() => { setPanelOpen(false); act('Connection draft created'); }}>Continue to Azure</button><small className="secure">◈ Secure connection via Microsoft Entra ID</small></section></div>}
    {notice && <div className="toast" role="status">✓ {notice}</div>}
  </div>;
}
