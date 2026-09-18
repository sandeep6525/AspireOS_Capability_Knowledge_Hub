import { useState, useEffect } from 'react';
import { api } from '../lib/api';

interface AdminFeedbackItem {
  id: number;
  content_id: number | null;
  useful: boolean;
  note: string;
  created_at: string;
  learner_name: string;
  learner_email: string;
}

export function AdminFeedback() {
  const [feedback, setFeedback] = useState<AdminFeedbackItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await api<AdminFeedbackItem[]>('/admin/feedback');
        setFeedback(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load feedback records.');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return <div style={{ padding: '2rem' }}>Loading feedback...</div>;
  }

  if (error) {
    return (
      <div className="panel" style={{ borderLeft: '4px solid red', margin: '2rem' }}>
        <h3 style={{ margin: '0 0 0.5rem 0' }}>Error</h3>
        <p style={{ margin: 0 }}>{error}</p>
      </div>
    );
  }

  return (
    <>
      <header>
        <div>
          <p className="eyebrow">Administration</p>
          <h1>Feedback</h1>
          <p className="muted">Review learner feedback and platform usefulness signals.</p>
        </div>
      </header>

      <section>
        {!feedback || feedback.length === 0 ? (
          <div className="panel" style={{ textAlign: 'center', padding: '3rem' }}>
            <p className="muted">No learner feedback has been submitted yet.</p>
          </div>
        ) : (
          <div className="grid" style={{ gridTemplateColumns: '1fr', gap: '1rem' }}>
            {feedback.map((fb) => (
              <div key={fb.id} className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ margin: '0 0 0.25rem 0' }}>{fb.learner_name}</h3>
                    <div className="muted" style={{ fontSize: '0.875rem' }}>{fb.learner_email}</div>
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                    {new Date(fb.created_at).toLocaleString(undefined, {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Useful:</span>
                  <span style={{
                    padding: '0.125rem 0.5rem',
                    borderRadius: '999px',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    background: fb.useful ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    color: fb.useful ? 'rgb(21, 128, 61)' : 'rgb(185, 28, 28)'
                  }}>
                    {fb.useful ? 'Yes' : 'No'}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Comments:</span>
                  <p style={{ margin: 0, padding: '0.75rem', background: 'var(--bg)', borderRadius: '4px', whiteSpace: 'pre-wrap', fontSize: '0.875rem' }}>
                    {fb.note ? `"${fb.note}"` : <span className="muted italic">No comments provided.</span>}
                  </p>
                </div>

                {fb.content_id && (
                  <div style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>
                    <span style={{ fontWeight: 500 }}>Related Content: </span>
                    <span className="muted">{fb.content_id}</span>
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
