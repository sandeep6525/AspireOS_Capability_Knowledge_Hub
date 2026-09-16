import {BookOpen, BrainCircuit, ChartNoAxesCombined, Home, Settings, Sparkles, LogOut, ClipboardCheck, Target, BookCheck, Inbox, MessageSquare} from 'lucide-react';
import {useState, useEffect} from 'react';

export function Shell({children,tab,setTab,onLogout,user}:{children:React.ReactNode;tab:string;setTab:(x:string)=>void;onLogout:()=>void,user:any}) {
  const learnerNav=[['Overview',Home],['Updates',BookOpen],['Skills',BrainCircuit],['Assessments',ClipboardCheck],['Skill Gaps',Target],['Learning Plans',BookCheck],['Digests',Inbox],['Feedback',MessageSquare],['Analytics',ChartNoAxesCombined],['Settings',Settings]] as const;
  const adminNav=[['Overview',Home],['Sources',BookOpen],['Content Review',ClipboardCheck],['Evidence Review',BookCheck],['Audit History',Target],['Analytics',ChartNoAxesCombined]] as const;
  
  const nav = user.role === 'admin' ? adminNav : learnerNav;

  return (
    <div className="layout">
      <aside>
        <div className="brand"><Sparkles/> AspireOS</div>
        <p className="muted">Capability & Knowledge Hub</p>
        <nav>{nav.map(([name,Icon])=><button key={name} className={tab===name?'active':''} onClick={()=>setTab(name)}><Icon size={18}/>{name}</button>)}</nav>
        <div className="profile">
          <div className="avatar">{user ? user.name.substring(0, 2).toUpperCase() : '..'}</div>
          <span style={{flex: 1}}>{user ? user.name : 'Loading...'}<small>{user ? user.role : ''}</small></span>
          <button onClick={onLogout} style={{background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: '0.25rem'}} title="Logout"><LogOut size={16}/></button>
        </div>
      </aside>
      <main>{children}</main>
    </div>
  )
}
