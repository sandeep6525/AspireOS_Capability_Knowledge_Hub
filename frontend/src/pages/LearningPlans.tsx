import { useEffect, useState } from 'react';
import { api, LearningPlan } from '../lib/api';

export function LearningPlans() {
  const [plans, setPlans] = useState<LearningPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    api<LearningPlan[]>('/learning-plans')
      .then((data) => {
        setPlans(data);
        setError(false);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <header>
        <div>
          <p className="eyebrow">Learning Plans</p>
          <h1>Development Roadmap</h1>
          <p className="muted">Your active plans and milestones for career development.</p>
        </div>
      </header>

      <section className="grid" style={{ gridTemplateColumns: '1fr', maxWidth: '800px', margin: '0' }}>
        {loading && <div className="panel"><p>Loading plans...</p></div>}
        
        {error && !loading && (
          <div className="panel" style={{ borderLeft: '4px solid red' }}>
            <h2>Could not load learning plans</h2>
            <p>Please check your connection and try again.</p>
          </div>
        )}

        {!loading && !error && plans.length === 0 && (
          <div className="panel">
            <h2>No active plans</h2>
            <p className="muted">You currently do not have any active learning plans assigned to you.</p>
          </div>
        )}

        {!loading && !error && plans.length > 0 && (
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            {plans.map((plan) => (
              <div className="panel" key={plan.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div>
                    <h3 style={{ margin: '0 0 0.25rem 0' }}>{plan.title}</h3>
                    <span className="tags" style={{ margin: 0 }}>
                      <span style={{ 
                        background: plan.status === 'active' ? 'var(--accent)' : 'var(--border)',
                        color: plan.status === 'active' ? 'white' : 'inherit'
                      }}>
                        {plan.status.replace('_', ' ')}
                      </span>
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <strong style={{ fontSize: '1.25rem' }}>{plan.progress}%</strong>
                  </div>
                </div>
                
                <div className="bar" style={{ marginBottom: '1.5rem', background: 'var(--border)' }}>
                  <i style={{ width: `${plan.progress}%`, background: 'var(--accent)' }} />
                </div>
                
                {plan.milestones && plan.milestones.length > 0 && (
                  <div>
                    <h4 style={{ marginBottom: '0.75rem', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)' }}>
                      Milestones
                    </h4>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.5rem' }}>
                      {plan.milestones.map((m, idx) => (
                        <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem', background: 'var(--bg)', borderRadius: '4px' }}>
                          <div style={{ 
                            width: '16px', 
                            height: '16px', 
                            borderRadius: '50%',
                            border: `2px solid ${m.status === 'done' ? 'var(--accent)' : 'var(--border)'}`,
                            background: m.status === 'done' ? 'var(--accent)' : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            {m.status === 'done' && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                          </div>
                          <span style={{ flex: 1, textDecoration: m.status === 'done' ? 'line-through' : 'none', color: m.status === 'done' ? 'var(--muted)' : 'var(--text)' }}>
                            {m.title}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'capitalize' }}>
                            {m.status.replace('_', ' ')}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
