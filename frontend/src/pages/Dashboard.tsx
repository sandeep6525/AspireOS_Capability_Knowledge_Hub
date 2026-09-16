import {useEffect,useState} from 'react';import {ArrowUpRight,BookMarked,Clock3,Target,TrendingUp} from 'lucide-react';import {api,Content,Gap,LearningPlan,Digest} from '../lib/api';
export function Dashboard({tab}:{tab:string}){
  const [feed,setFeed]=useState<Content[]>([]);
  const [gaps,setGaps]=useState<Gap[]>([]);
  const [plan,setPlan]=useState<LearningPlan | null>(null);
  const [digest,setDigest]=useState<Digest | null>(null);
  const [user, setUser]=useState<any>(null);

  useEffect(()=>{
    api<Content[]>('/feed').then(setFeed).catch(()=>{});
    api<Gap[]>('/skill-gaps').then(setGaps).catch(()=>{});
    api<LearningPlan[]>('/learning-plans').then(res => setPlan(res[0] || null)).catch(()=>{});
    api<Digest>('/digests/weekly').then(setDigest).catch(()=>{});
    api('/me').then(setUser).catch(()=>{});
  },[]);

  return <><header><div><p className="eyebrow">{tab}</p><h1>Good evening, {user ? user.name : '...'}</h1><p className="muted">Trusted knowledge, measurable growth, one purposeful pathway.</p></div><select aria-label="Digest frequency"><option>Daily digest</option><option>Weekly digest</option><option>Monthly digest</option></select></header>
  <section className="stats">
    <Stat icon={<BookMarked/>} n={`${digest ? digest.updates.length : 0}`} label="Resources this week"/>
    <Stat icon={<Target/>} n={`${gaps.length}`} label="Priority skill gaps"/>
    <Stat icon={<TrendingUp/>} n={`${plan ? plan.progress : 0}%`} label="Learning-plan progress"/>
    <Stat icon={<Clock3/>} n="N/A" label="Capability time has no backend data source yet"/>
  </section>
  <section className="grid">
    <div className="panel span2"><div className="panelHead"><div><p className="eyebrow">FOR YOU</p><h2>Evidence-based updates</h2></div><button className="link">View all</button></div>
    {feed.slice(0,4).map(item=><article className="resource" key={item.id}><div className="resourceIcon">{item.resource_type[0]}</div><div><div className="tags"><span>{item.resource_type}</span>{item.topics.slice(0,2).map(x=><span key={x}>{x}</span>)}</div><h3>{item.title}</h3><p>{item.abstract}</p><a href={item.canonical_url} target="_blank" rel="noreferrer">Open official source <ArrowUpRight size={14}/></a></div></article>)}
    </div>
    <div className="panel"><p className="eyebrow">SKILL INTELLIGENCE</p><h2>Your priority gaps</h2>{gaps.map(g=><div className="skill" key={g.skill}><div><strong>{g.skill}</strong><small>{g.current} → {g.target} proficiency</small></div><b>{g.gap}</b><div className="bar"><i style={{width:`${g.current/g.target*100}%`}}/></div></div>)}<button className="primary">Build adaptive learning plan</button></div>
    <div className="panel span2"><p className="eyebrow">LEARNING PATH</p><h2>{plan ? plan.title : 'No active learning path'}</h2>
    <div className="milestones">
      {plan?.milestones.map((m, i) => <label key={i} className={m.status === 'done' ? 'done' : (m.status === 'in_progress' ? 'current' : '')}>{m.status === 'done' ? '✓ ' : `${i+1} `}{m.title}</label>)}
    </div></div>
    <div className="panel accent"><p className="eyebrow">STAKEHOLDER IMPACT</p><h2>Grow capability, not content overload.</h2><p>Every update maps to your role, a skill, an action and an evidence outcome.</p></div>
  </section></>
}
function Stat({icon,n,label}:{icon:React.ReactNode;n:string;label:string}){return <div className="stat"><span>{icon}</span><div><b>{n}</b><small>{label}</small></div></div>}
