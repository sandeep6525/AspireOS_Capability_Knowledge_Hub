import {useEffect, useState} from 'react';
import {api, SkillGapAnalytics, ContentAnalytics, FeedbackAnalytics, LearningPlanAnalytics} from '../lib/api';

export function Analytics() {
  const [skillGaps, setSkillGaps] = useState<SkillGapAnalytics[] | null>(null);
  const [content, setContent] = useState<ContentAnalytics[] | null>(null);
  const [feedback, setFeedback] = useState<FeedbackAnalytics | null>(null);
  const [learningPlans, setLearningPlans] = useState<LearningPlanAnalytics | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api<SkillGapAnalytics[]>('/analytics/skill-gaps').then(setSkillGaps),
      api<ContentAnalytics[]>('/analytics/content').then(setContent),
      api<FeedbackAnalytics>('/analytics/feedback').then(setFeedback),
      api<LearningPlanAnalytics>('/analytics/learning-plans').then(setLearningPlans)
    ])
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{padding: '2rem'}}>Loading analytics...</div>;
  if (error) return <div style={{padding: '2rem', color: 'red'}}>Error loading analytics: {error}</div>;

  return (
    <>
      <header>
        <div>
          <p className="eyebrow">Admin</p>
          <h1>Analytics</h1>
        </div>
      </header>
      <section className="grid">
        
        <div className="panel span2">
          <h2>Organizational Skill Gaps</h2>
          {skillGaps && skillGaps.length > 0 ? (
            <table style={{width: '100%', textAlign: 'left', marginTop: '1rem'}}>
              <thead><tr><th>Skill</th><th>Average Gap</th><th></th></tr></thead>
              <tbody>
                {skillGaps.map(g => (
                  <tr key={g.skill_id}>
                    <td style={{width: '30%'}}>{g.skill_name}</td>
                    <td style={{width: '20%'}}>{g.average_gap.toFixed(2)}</td>
                    <td style={{width: '50%'}}>
                      <div className="bar" style={{background: '#eee', height: '12px', width: '100%', borderRadius: '6px'}}>
                        <div style={{background: 'var(--primary)', height: '12px', borderRadius: '6px', width: `${Math.min(100, g.average_gap * 20)}%`}}></div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No skill gap data available.</p>
          )}
        </div>

        <div className="panel">
          <h2>Content Governance</h2>
          {content && content.length > 0 ? (
            <ul style={{marginTop: '1rem', listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
              {content.map(c => (
                <li key={c.status} style={{display: 'flex', justifyContent: 'space-between'}}>
                  <span style={{textTransform: 'capitalize'}}>{c.status.replace('_', ' ')}</span>
                  <strong>{c.count}</strong>
                </li>
              ))}
            </ul>
          ) : (
            <p>No content data available.</p>
          )}
        </div>

        <div className="panel">
          <h2>Content Usefulness</h2>
          {feedback && feedback.total_feedback > 0 ? (
            <div style={{marginTop: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
              <div style={{fontSize: '3rem', fontWeight: 'bold', color: 'var(--primary)'}}>
                {feedback.usefulness_percentage?.toFixed(1)}%
              </div>
              <div style={{display: 'flex', justifyContent: 'space-between', width: '100%', marginTop: '1rem', fontSize: '0.9rem', color: 'var(--muted)'}}>
                <span>Useful: {feedback.useful_feedback}</span>
                <span>Total: {feedback.total_feedback}</span>
              </div>
            </div>
          ) : (
            <p>No feedback data available.</p>
          )}
        </div>

        <div className="panel">
          <h2>Learning Plan Completion</h2>
          {learningPlans && learningPlans.active_plan_count > 0 ? (
            <div style={{marginTop: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
              <div style={{fontSize: '3rem', fontWeight: 'bold', color: 'var(--primary)'}}>
                {learningPlans.average_progress?.toFixed(1)}%
              </div>
              <div style={{marginTop: '1rem', fontSize: '0.9rem', color: 'var(--muted)'}}>
                Active plans: {learningPlans.active_plan_count}
              </div>
            </div>
          ) : (
            <p>No active learning plans available.</p>
          )}
        </div>

      </section>
    </>
  );
}
