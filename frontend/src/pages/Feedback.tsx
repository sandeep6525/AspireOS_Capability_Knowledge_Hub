import { useState } from 'react';
import { apiPost, FeedbackIn } from '../lib/api';

export function Feedback() {
  const [contentId, setContentId] = useState<string>('');
  const [useful, setUseful] = useState<boolean>(true);
  const [note, setNote] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const payload: FeedbackIn = {
        useful,
        note
      };
      
      const parsedId = parseInt(contentId, 10);
      if (!isNaN(parsedId) && parsedId > 0) {
        payload.content_id = parsedId;
      }

      await apiPost<{status: string}>('/feedback', payload);
      setSuccess(true);
      setContentId('');
      setUseful(true);
      setNote('');
    } catch (err: any) {
      setError(err.message || 'Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <header>
        <div>
          <p className="eyebrow">Platform</p>
          <h1>Feedback</h1>
          <p className="muted">Help us improve the Knowledge Hub by sharing your experience.</p>
        </div>
      </header>

      <section className="grid" style={{ gridTemplateColumns: '1fr', maxWidth: '600px', margin: '0' }}>
        {success && (
          <div className="panel" style={{ borderLeft: '4px solid var(--accent)', background: 'rgba(59, 130, 246, 0.1)' }}>
            <h3 style={{ margin: '0 0 0.5rem 0' }}>Thank you!</h3>
            <p style={{ margin: 0 }}>Your feedback has been recorded successfully.</p>
          </div>
        )}

        {error && (
          <div className="panel" style={{ borderLeft: '4px solid red' }}>
            <h3 style={{ margin: '0 0 0.5rem 0' }}>Submission Failed</h3>
            <p style={{ margin: 0 }}>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontWeight: 500 }}>Was this platform useful?</label>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input 
                  type="radio" 
                  name="useful" 
                  checked={useful === true} 
                  onChange={() => setUseful(true)} 
                />
                Yes
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input 
                  type="radio" 
                  name="useful" 
                  checked={useful === false} 
                  onChange={() => setUseful(false)} 
                />
                No
              </label>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label htmlFor="note" style={{ fontWeight: 500 }}>Comments</label>
            <textarea 
              id="note" 
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Tell us what you liked or how we can improve..."
              maxLength={2000}
              rows={5}
              style={{ padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'inherit', resize: 'vertical' }}
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--muted)', textAlign: 'right' }}>
              {note.length} / 2000
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label htmlFor="contentId" style={{ fontWeight: 500 }}>Related Content ID (Optional)</label>
            <p style={{ fontSize: '0.875rem', color: 'var(--muted)', margin: 0 }}>
              If your feedback is about a specific article or update, enter its ID here.
            </p>
            <input 
              id="contentId" 
              type="number" 
              value={contentId}
              onChange={(e) => setContentId(e.target.value)}
              placeholder="e.g. 12"
              min="1"
              style={{ padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'inherit' }}
            />
          </div>

          <button 
            type="submit" 
            disabled={submitting}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'var(--text)',
              color: 'var(--bg)',
              border: 'none',
              borderRadius: '4px',
              fontWeight: 500,
              cursor: submitting ? 'not-allowed' : 'pointer',
              opacity: submitting ? 0.7 : 1,
              marginTop: '0.5rem'
            }}
          >
            {submitting ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </form>
      </section>
    </>
  );
}
