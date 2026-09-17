import { useEffect, useState } from 'react';
import { api, apiPost, Skill, Evidence as EvidenceType } from '../lib/api';

export function Evidence() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [evidenceList, setEvidenceList] = useState<EvidenceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [selectedSkill, setSelectedSkill] = useState<number | ''>('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [evidenceDescription, setEvidenceDescription] = useState('');

  const [submittingEvidence, setSubmittingEvidence] = useState(false);
  const [message, setMessage] = useState<{type: 'success'|'error', text: string} | null>(null);

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      api<Skill[]>('/skills'),
      api<EvidenceType[]>('/evidence')
    ])
      .then(([skillsData, evidenceData]) => {
        setSkills(skillsData);
        setEvidenceList(evidenceData);
        setError(false);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSkill === '' || !evidenceUrl || !evidenceDescription) {
      setMessage({type: 'error', text: 'Please select a skill, provide a URL, and a description.'});
      return;
    }

    setSubmittingEvidence(true);
    setMessage(null);

    try {
      await apiPost('/evidence', {
        skill_id: Number(selectedSkill),
        url: evidenceUrl,
        description: evidenceDescription
      });
      setMessage({type: 'success', text: 'Evidence submitted successfully!'});
      setEvidenceUrl('');
      setEvidenceDescription('');
      fetchData(); // refresh evidence list
    } catch (err: any) {
      setMessage({type: 'error', text: err.message || 'Failed to submit evidence.'});
    } finally {
      setSubmittingEvidence(false);
    }
  };

  const getSkillName = (id: number) => skills.find(s => s.id === id)?.name || 'Unknown Skill';

  return (
    <>
      <header>
        <div>
          <p className="eyebrow">Evidence</p>
          <h1>Capability Evidence</h1>
          <p className="muted">Submit evidence for verification of your skills.</p>
        </div>
      </header>

      <section className="grid" style={{ gridTemplateColumns: '1fr', maxWidth: '800px', gap: '2rem', margin: '0' }}>
        {loading && <div className="panel"><p>Loading...</p></div>}
        {error && !loading && (
          <div className="panel" style={{ borderLeft: '4px solid red' }}>
            <h2>Could not load data</h2>
            <p>Please check your connection and try again.</p>
          </div>
        )}

        {!loading && !error && (
          <>
            {message && (
              <div className="panel" style={{ borderLeft: `4px solid ${message.type === 'success' ? 'green' : 'red'}` }}>
                <p style={{ color: message.type === 'success' ? 'green' : 'red', margin: 0 }}>{message.text}</p>
              </div>
            )}

            <div className="panel">
              <h2>Submit Evidence</h2>
              <form onSubmit={handleSaveEvidence} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                <label>
                  Skill
                  <select
                    value={selectedSkill}
                    onChange={e => setSelectedSkill(e.target.value === '' ? '' : Number(e.target.value))}
                    required
                  >
                    <option value="">-- Select a Skill --</option>
                    {skills.map(skill => (
                      <option key={skill.id} value={skill.id}>{skill.name}</option>
                    ))}
                  </select>
                </label>

                <label>
                  Evidence URL
                  <input type="url" value={evidenceUrl} onChange={e => setEvidenceUrl(e.target.value)} required placeholder="https://..." />
                </label>

                <label>
                  Description / Justification
                  <textarea value={evidenceDescription} onChange={e => setEvidenceDescription(e.target.value)} required rows={4} placeholder="Describe how this evidence demonstrates your proficiency." />
                </label>

                <button type="submit" disabled={submittingEvidence} style={{ alignSelf: 'flex-start' }}>
                  {submittingEvidence ? 'Submitting...' : 'Submit Evidence'}
                </button>
              </form>
            </div>

            <div className="panel">
              <h2>Evidence History</h2>
              {evidenceList.length === 0 ? (
                <p className="muted">No evidence submitted yet.</p>
              ) : (
                <div className="table-responsive">
                  <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', marginTop: '1rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border)' }}>
                        <th style={{ padding: '0.5rem' }}>Skill</th>
                        <th style={{ padding: '0.5rem' }}>Description</th>
                        <th style={{ padding: '0.5rem' }}>URL</th>
                        <th style={{ padding: '0.5rem' }}>Status</th>
                        <th style={{ padding: '0.5rem' }}>Submitted At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {evidenceList.map(ev => (
                        <tr key={ev.id} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '0.5rem' }}>{getSkillName(ev.skill_id)}</td>
                          <td style={{ padding: '0.5rem', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.description}</td>
                          <td style={{ padding: '0.5rem' }}><a href={ev.url} target="_blank" rel="noreferrer">View</a></td>
                          <td style={{ padding: '0.5rem' }}>
                            <span style={{
                              padding: '0.25rem 0.5rem',
                              borderRadius: '4px',
                              fontSize: '0.85em',
                              backgroundColor: ev.status === 'verified' ? '#e8f5e9' : ev.status === 'rejected' ? '#ffebee' : '#fff8e1',
                              color: ev.status === 'verified' ? 'green' : ev.status === 'rejected' ? 'red' : '#f57f17'
                            }}>
                              {ev.status.toUpperCase()}
                            </span>
                          </td>
                          <td style={{ padding: '0.5rem' }}>{new Date(ev.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </section>
    </>
  );
}
