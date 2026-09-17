import { useEffect, useState } from 'react';
import { api, LearningPlan } from '../lib/api';

export function LearningPlans({setTab}: {setTab: (t: string) => void}) {
  const [plans, setPlans] = useState<LearningPlan[]>([]);
  const [allGaps, setAllGaps] = useState<any[]>([]);
  const [gaps, setGaps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    Promise.all([
      api<LearningPlan[]>('/learning-plans'),
      api<any[]>('/skill-gaps')
    ])
      .then(([plansData, gapsData]) => {
        setPlans(plansData);
        setAllGaps(gapsData);
        setGaps(gapsData.filter(g => g.gap > 0));
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
          <p className="muted">Your personalized, dynamic capability development plan.</p>
        </div>
      </header>

      <section className="grid" style={{ gridTemplateColumns: '1fr', maxWidth: '900px', margin: '0' }}>
        {loading && <div className="panel"><p>Loading your personalised plan...</p></div>}

        {error && !loading && (
          <div className="panel" style={{ borderLeft: '4px solid red' }}>
            <h2>Could not load learning plans</h2>
            <p>Please check your connection and try again.</p>
          </div>
        )}

        {!loading && !error && allGaps.length === 0 && (
          <div className="panel">
            <h2>No active learning plan yet.</h2>
            <p className="muted">Complete an assessment to generate your personalised development plan.</p>
          </div>
        )}

        {!loading && !error && plans.length > 0 && (
          <div style={{ display: 'grid', gap: '2rem' }}>
            {plans.map((plan) => (
              <div key={plan.id}>
                <div className="panel" style={{ marginBottom: '2rem', padding: '2rem', background: 'var(--panel-alt)', border: '1px solid var(--accent)', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div>
                      <h2 style={{ margin: '0 0 0.5rem 0', color: 'var(--accent)' }}>{plan.title}</h2>
                      <span className="tags" style={{ margin: 0 }}>
                        <span style={{ background: 'var(--accent)', color: 'white' }}>
                          {gaps.length === 0 ? 'Maintenance' : 'Active Plan'}
                        </span>
                      </span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--muted)' }}>Overall Progress</p>
                      <strong style={{ fontSize: '2.5rem', color: 'var(--text)' }}>{plan.progress}%</strong>
                    </div>
                  </div>

                  <div className="bar" style={{ height: '12px', borderRadius: '6px', background: 'var(--border)' }}>
                    <i style={{ width: `${plan.progress}%`, background: 'var(--accent)', borderRadius: '6px' }} />
                  </div>
                </div>

                {gaps.length === 0 ? (
                  <div className="panel" style={{ padding: '2rem', borderLeft: '4px solid #4caf50' }}>
                    <h3 style={{ margin: '0 0 1rem 0', color: '#4caf50' }}>All assessed skills are currently at or above target.</h3>
                    <p className="muted">No active skill gaps require a learning plan. Keep up the good work!</p>
                    <div style={{ marginTop: '2rem', display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                      {allGaps.map((gap, i) => (
                        <div key={i} style={{ padding: '1rem', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '6px' }}>
                          <h4 style={{ margin: '0 0 0.5rem 0' }}>{gap.skill}</h4>
                          <div style={{ display: 'flex', gap: '2rem' }}>
                            <div>
                              <span className="muted" style={{ display: 'block', fontSize: '0.75rem' }}>Current / Verified</span>
                              <strong>{gap.current} {gap.verified != null ? ` / ${gap.verified} (V)` : ''}</strong>
                            </div>
                            <div>
                              <span className="muted" style={{ display: 'block', fontSize: '0.75rem' }}>Target</span>
                              <strong>{gap.target}</strong>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    <h3 style={{ marginBottom: '1rem' }}>Priority Skills</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                      {gaps.slice(0, 3).map((gap, i) => {
                        const resources = plan.milestones?.filter((m: any) => m.skill === gap.skill && m.type === 'resource') || [];
                        const evidence = plan.milestones?.find((m: any) => m.skill === gap.skill && m.type === 'evidence');

                        return (
                          <div key={i} className="panel" style={{ padding: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <div style={{ flex: 1, paddingRight: '2rem' }}>
                                <h4 style={{ margin: '0 0 1rem 0', fontSize: '1.25rem' }}>{gap.skill}</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                  <div>
                                    <span className="muted" style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Current / Verified</span>
                                    <strong>{gap.current} {gap.verified != null ? ` / ${gap.verified} (V)` : ''}</strong>
                                  </div>
                                  <div>
                                    <span className="muted" style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Target</span>
                                    <strong>{gap.target}</strong>
                                  </div>
                                  <div>
                                    <span style={{ color: 'var(--accent)', fontWeight: 600, display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Gap</span>
                                    <strong style={{ color: 'var(--accent)', fontSize: '1.25rem' }}>{gap.gap}</strong>
                                  </div>
                                </div>
                                <div className="bar" style={{ marginBottom: '0.5rem', background: 'var(--border)' }}>
                                  <i style={{ width: `${(gap.effective / gap.target) * 100}%`, background: 'var(--text)' }} />
                                </div>
                              </div>
                            </div>

                            <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
                              <h5 style={{ margin: '0 0 1rem 0', fontSize: '1rem' }}>Recommended Resources</h5>
                              {resources.length > 0 ? (
                                <div style={{ display: 'grid', gap: '1rem' }}>
                                  {resources.map((r: any, rIdx: number) => (
                                    <div key={rIdx} style={{ padding: '1.25rem', background: 'var(--bg)', borderRadius: '6px', border: '1px solid var(--border)' }}>
                                      <h6 style={{ margin: '0 0 0.75rem 0', fontSize: '1rem' }}>{r.title.replace('Review resource: ', '')}</h6>
                                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', fontSize: '0.875rem', color: 'var(--muted)', marginBottom: '1.25rem' }}>
                                        {r.source && <span><strong style={{ color: 'var(--text)' }}>Source:</strong> {r.source}</span>}
                                        {r.resource_type && <span><strong style={{ color: 'var(--text)' }}>Type:</strong> <span style={{ textTransform: 'capitalize' }}>{r.resource_type}</span></span>}
                                        {r.published_at && <span><strong style={{ color: 'var(--text)' }}>Published:</strong> {new Date(r.published_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>}
                                      </div>
                                      {r.url && (
                                        <a href={r.url} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'transparent', border: '1px solid var(--accent)', color: 'var(--accent)', borderRadius: '4px', textDecoration: 'none', fontWeight: 600, fontSize: '0.875rem' }}>
                                          Open resource &rarr;
                                        </a>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="muted" style={{ fontSize: '0.875rem', fontStyle: 'italic' }}>No approved learning resource is currently available for this skill.</p>
                              )}
                            </div>

                            <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                               <div>
                                 <h5 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem' }}>Evidence Validation</h5>
                                 <span className="muted" style={{ fontSize: '0.875rem' }}>Submit evidence to update your verified level.</span>
                               </div>
                               <div style={{ textAlign: 'right' }}>
                                  <span style={{
                                    display: 'inline-block',
                                    padding: '0.35rem 0.75rem',
                                    borderRadius: '4px',
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    textTransform: 'uppercase',
                                    background: ['done', 'verified'].includes(evidence?.status || '') ? 'var(--bg)' : 'var(--accent)',
                                    color: ['done', 'verified'].includes(evidence?.status || '') ? 'var(--muted)' : 'white'
                                  }}>
                                    {evidence?.status ? evidence.status.replace('_', ' ') : 'Not Started'}
                                  </span>
                               </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="panel" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg)' }}>
                      <div>
                        <h4 style={{ margin: '0 0 0.5rem 0' }}>Ready to verify your skills?</h4>
                        <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.875rem' }}>
                          Once you have completed learning activities, submit evidence to have your skills verified by an admin.
                        </p>
                      </div>
                        <button className="primary" onClick={() => setTab('Evidence')}>Go to Evidence</button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
