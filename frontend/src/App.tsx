import {useState, useEffect} from 'react';import {Shell} from './components/Shell';import {Dashboard} from './pages/Dashboard';import {Updates} from './pages/Updates';import {Skills} from './pages/Skills';import {Assessments} from './pages/Assessments';import {SkillGaps} from './pages/SkillGaps';import {LearningPlans} from './pages/LearningPlans';import {Digests} from './pages/Digests';import {Feedback} from './pages/Feedback';import {Login} from './components/Login';import {AdminOverview, AdminSources, AdminContent, AdminAudit, AdminEvidence} from './pages/Admin';import {Analytics} from './pages/Analytics';import {Settings} from './pages/Settings';import {api} from './lib/api';import './style.css';import {Evidence} from './pages/Evidence';
export default function App(){
  const [tab,setTab]=useState('Overview');
  const [token, setToken]=useState<string | null>(localStorage.getItem('token'));
  const [user, setUser]=useState<any>(null);

  useEffect(() => {
    if (token) {
      api('/me').then(setUser).catch(() => handleLogout());
    } else {
      setUser(null);
    }
  }, [token]);

  const handleLogin = (t: string) => {
    localStorage.setItem('token', t);
    setToken(t);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
  };
  
  if (!token) return <Login onLogin={handleLogin} />;
  if (!user) return <div>Loading...</div>;

  if (user.role === 'admin') {
    return <Shell user={user} tab={tab} setTab={setTab} onLogout={handleLogout}>
      {tab === 'Overview' && <AdminOverview />}
      {tab === 'Sources' && <AdminSources />}
      {tab === 'Content Review' && <AdminContent />}
      {tab === 'Evidence Review' && <AdminEvidence />}
      {tab === 'Audit History' && <AdminAudit />}
      {tab === 'Analytics' && <Analytics />}
      {tab === 'Settings' && <Settings />}
    </Shell>
  }
  
  return <Shell user={user} tab={tab} setTab={setTab} onLogout={handleLogout}>
    {tab === 'Overview' && <Dashboard tab={tab} setTab={setTab} />}
    {tab === 'Updates' && <Updates />}
    {tab === 'Skills' && <Skills />}
    {tab === 'Assessments' && <Assessments />}
    {tab === 'Evidence' && <Evidence />}
    {tab === 'Skill Gaps' && <SkillGaps />}
    {tab === 'Learning Plans' && <LearningPlans setTab={setTab} />}
    {tab === 'Digests' && <Digests />}
    {tab === 'Feedback' && <Feedback />}
    {tab === 'Settings' && <Settings />}
  </Shell>
}
