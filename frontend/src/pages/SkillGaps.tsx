import { useEffect, useState } from 'react';
import { api, Gap } from '../lib/api';

export function SkillGaps() {
  const [gaps, setGaps] = useState<Gap[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    api<Gap[]>('/skill-gaps')
      .then((data) => {
        setGaps(data);
        setError(false);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <header>
        <div>
          <p className="eyebrow">Skill Gaps</p>
          <h1>Your Proficiency Gaps</h1>
          <p className="muted">Priority areas calculated based on your assessments.</p>
        </div>
      </header>

      <section className="grid" style={{ gridTemplateColumns: '1fr', maxWidth: '800px', margin: '0' }}>
        {loading && <div className="panel"><p>Loading gaps...</p></div>}
        
        {error && !loading && (
          <div className="panel" style={{ borderLeft: '4px solid red' }}>
            <h2>Could not load skill gaps</h2>
            <p>Please check your connection and try again.</p>
          </div>
        )}

        {!loading && !error && gaps.length === 0 && (
          <div className="panel">
            <h2>No gaps identified</h2>
            <p className="muted">You have either not completed any assessments, or you meet the target proficiency for all assessed skills.</p>
          </div>
        )}

        {!loading && !error && gaps.length > 0 && (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {gaps.map((gap, idx) => (
              <div className="panel" key={idx} style={{ position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h3 style={{ margin: '0 0 1rem 0' }}>{gap.skill}</h3>
                  <div style={{ textAlign: 'right' }}>
                    <strong style={{ fontSize: '1.25rem', color: gap.gap > 0 ? 'var(--accent)' : 'var(--text)' }}>
                      Gap: {gap.gap}
                    </strong>
                  </div>
                </div>
                
                <div className="skill">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                    <span>Current: <strong>{gap.current}</strong></span>
                    <span>Target: <strong>{gap.target}</strong></span>
                  </div>
                  
                  <div className="bar" style={{ position: 'relative', background: 'var(--border)' }}>
                    <i 
                      style={{ 
                        width: `${Math.min((gap.current / 5) * 100, 100)}%`, 
                        background: 'var(--text)', 
                        position: 'absolute', 
                        zIndex: 2, 
                        borderRight: '1px solid var(--bg)' 
                      }} 
                    />
                    <i 
                      style={{ 
                        width: `${Math.min((gap.target / 5) * 100, 100)}%`, 
                        background: gap.gap > 0 ? 'rgba(255,100,100,0.2)' : 'rgba(100,255,100,0.2)', 
                        position: 'absolute', 
                        zIndex: 1 
                      }} 
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
