import { useEffect, useState } from 'react';
import { api, Digest } from '../lib/api';

export function Digests() {
  const [cadence, setCadence] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [digest, setDigest] = useState<Digest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    api<Digest>(`/digests/${cadence}`)
      .then((data) => {
        setDigest(data);
        setError(false);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [cadence]);

  return (
    <>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <p className="eyebrow">Personalized</p>
          <h1>Knowledge Digests</h1>
          <p className="muted">Curated updates and focus areas based on your role and assessments.</p>
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg)', padding: '0.25rem', borderRadius: '4px', border: '1px solid var(--border)' }}>
          {(['daily', 'weekly', 'monthly'] as const).map(c => (
            <button 
              key={c}
              onClick={() => setCadence(c)}
              style={{
                background: cadence === c ? 'var(--text)' : 'transparent',
                color: cadence === c ? 'var(--bg)' : 'var(--text)',
                border: 'none',
                padding: '0.25rem 0.75rem',
                borderRadius: '2px',
                cursor: 'pointer',
                textTransform: 'capitalize',
                fontSize: '0.875rem'
              }}
            >
              {c}
            </button>
          ))}
        </div>
      </header>

      <section className="grid" style={{ gridTemplateColumns: '1fr', maxWidth: '800px', margin: '0' }}>
        {loading && <div className="panel"><p>Generating your {cadence} digest...</p></div>}
        
        {error && !loading && (
          <div className="panel" style={{ borderLeft: '4px solid red' }}>
            <h2>Could not load digest</h2>
            <p>Please check your connection and try again.</p>
          </div>
        )}

        {!loading && !error && digest && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ fontSize: '0.875rem', color: 'var(--muted)', display: 'flex', justifyContent: 'space-between' }}>
              <span>Generated for: <strong style={{ textTransform: 'capitalize' }}>{digest.stakeholder}</strong></span>
              <span>{new Date(digest.generated_at).toLocaleDateString()}</span>
            </div>
            
            {digest.recommended_action && (
              <div style={{ padding: '1rem', background: 'rgba(59, 130, 246, 0.1)', borderLeft: '4px solid var(--accent)', borderRadius: '4px' }}>
                <strong>Recommendation:</strong> {digest.recommended_action}
              </div>
            )}
            
            <div>
              <h2 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Relevant Updates</h2>
              {digest.updates.length === 0 ? (
                <p className="muted">No new approved updates in this period.</p>
              ) : (
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {digest.updates.map((update, idx) => (
                    <div className="panel" key={idx}>
                      <h3 style={{ margin: '0 0 0.5rem 0' }}>
                        <a href={update.url} target="_blank" rel="noreferrer" style={{ color: 'var(--text)', textDecoration: 'none' }}>
                          {update.title} ↗
                        </a>
                      </h3>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className="muted" style={{ fontSize: '0.875rem' }}>Source: {update.source}</span>
                        <div className="tags" style={{ margin: 0 }}>
                          {update.topics.map(t => <span key={t}>{t}</span>)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div>
              <h2 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Priority Skill Gaps</h2>
              {digest.priority_skill_gaps.length === 0 ? (
                <p className="muted">No critical skill gaps identified.</p>
              ) : (
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {digest.priority_skill_gaps.map((gap, idx) => (
                    <div className="panel" key={idx} style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h4 style={{ margin: 0 }}>{gap.skill}</h4>
                        <strong style={{ color: 'var(--accent)' }}>Gap: {gap.gap}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </>
  );
}
