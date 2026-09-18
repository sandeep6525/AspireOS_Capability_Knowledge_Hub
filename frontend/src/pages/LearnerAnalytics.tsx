import { useEffect, useState } from 'react';
import { api, Gap, LearningPlan, Evidence } from '../lib/api';

export function LearnerAnalytics() {
  const [gaps, setGaps] = useState<Gap[] | null>(null);
  const [plans, setPlans] = useState<LearningPlan[] | null>(null);
  const [evidence, setEvidence] = useState<Evidence[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [gapsData, plansData, evidenceData] = await Promise.all([
          api<Gap[]>('/skill-gaps'),
          api<LearningPlan[]>('/learning-plans'),
          api<Evidence[]>('/evidence')
        ]);
        setGaps(gapsData);
        setPlans(plansData);
        setEvidence(evidenceData);
      } catch (err: any) {
        setError(err.message || 'Failed to load analytics data.');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return <div style={{ padding: '2rem' }}>Loading your analytics...</div>;
  }

  if (error) {
    return (
      <div className="panel" style={{ borderLeft: '4px solid red', margin: '2rem' }}>
        <h3 style={{ margin: '0 0 0.5rem 0' }}>Error</h3>
        <p style={{ margin: 0 }}>{error}</p>
      </div>
    );
  }

  const activePlan = plans && plans.length > 0 ? plans[0] : null;
  const numGaps = gaps?.length || 0;

  // Calculate proficiency metrics
  const avgCurrent = numGaps > 0
    ? (gaps!.reduce((sum, g) => sum + g.current, 0) / numGaps).toFixed(1)
    : 'N/A';
  const avgTarget = numGaps > 0
    ? (gaps!.reduce((sum, g) => sum + g.target, 0) / numGaps).toFixed(1)
    : 'N/A';

  // Evidence metrics
  const totalEvidence = evidence?.length || 0;
  const verifiedEvidence = evidence?.filter(e => e.status === 'verified').length || 0;
  const pendingEvidence = evidence?.filter(e => e.status === 'pending').length || 0;
  const rejectedEvidence = evidence?.filter(e => e.status === 'rejected').length || 0;

  return (
    <>
      <header>
        <div>
          <p className="eyebrow">Analytics</p>
          <h1>My Capability Analytics</h1>
          <p className="muted">Track your skill development and progress.</p>
        </div>
      </header>

      <section className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>

        {/* Capability Overview */}
        <div className="panel">
          <h2>Capability Overview</h2>
          {numGaps === 0 ? (
            <p className="muted">No capability data yet. Complete an assessment to start your capability journey.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="muted">Priority Skill Gaps</span>
                <strong>{numGaps}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="muted">Average Current Proficiency</span>
                <strong>{avgCurrent} / 5.0</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="muted">Average Target Proficiency</span>
                <strong>{avgTarget} / 5.0</strong>
              </div>
            </div>
          )}
        </div>

        {/* Learning Progress */}
        <div className="panel">
          <h2>Learning Progress</h2>
          {!activePlan ? (
            <p className="muted">No active learning plan yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="muted">Active Plan</span>
                <strong>{activePlan.title}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="muted">Progress</span>
                <strong>{activePlan.progress}%</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="muted">Priority Skills</span>
                <strong style={{ textAlign: 'right' }}>{gaps?.map(g => g.skill).slice(0, 3).join(', ') || 'None'}</strong>
              </div>

              <div style={{ marginTop: '0.5rem' }}>
                <span className="muted" style={{ fontSize: '0.875rem' }}>Milestones</span>
                <ul style={{ paddingLeft: '1.25rem', marginTop: '0.5rem', marginBottom: 0, fontSize: '0.875rem' }}>
                  {activePlan.milestones.slice(0, 3).map((m, idx) => (
                    <li key={idx} style={{ color: m.status === 'done' ? 'var(--accent)' : 'inherit' }}>
                      {m.title} {m.status === 'done' ? '✓' : ''}
                    </li>
                  ))}
                  {activePlan.milestones.length > 3 && <li>...and more</li>}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Evidence */}
        <div className="panel">
          <h2>Evidence</h2>
          {totalEvidence === 0 ? (
            <p className="muted">No evidence submitted yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="muted">Total Records</span>
                <strong>{totalEvidence}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="muted">Verified</span>
                <strong style={{ color: 'var(--accent)' }}>{verifiedEvidence}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="muted">Pending</span>
                <strong>{pendingEvidence}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="muted">Rejected</span>
                <strong style={{ color: 'red' }}>{rejectedEvidence}</strong>
              </div>
            </div>
          )}
        </div>

        {/* Skill Progress */}
        <div className="panel" style={{ gridColumn: '1 / -1' }}>
          <h2>Skill Progress</h2>
          {numGaps === 0 ? (
            <p className="muted">No capability data yet.</p>
          ) : (
            <div style={{ display: 'grid', gap: '1.5rem', marginTop: '1.5rem' }}>
              {gaps?.map(g => (
                <div key={g.skill} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong>{g.skill}</strong>
                    <span style={{ fontSize: '0.875rem' }}>
                      Level {g.current} → {g.target} (Gap: {g.gap})
                    </span>
                  </div>

                  <div className="bar" style={{ background: 'var(--border)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        background: 'var(--accent)',
                        width: `${(g.current / Math.max(g.target, 1)) * 100}%`,
                        transition: 'width 0.3s ease'
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </section>
    </>
  );
}
