import { useEffect, useState } from 'react';
import { api, apiPut, Skill, Gap, AssessmentIn } from '../lib/api';

export function Assessments() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  
  const [selectedSkill, setSelectedSkill] = useState<number | ''>('');
  const [currentLevel, setCurrentLevel] = useState<number | ''>('');
  const [targetLevel, setTargetLevel] = useState<number | ''>('');
  const [confidence, setConfidence] = useState<number>(0.5);
  
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    api<Skill[]>('/skills')
      .then((data) => {
        setSkills(data);
        setError(false);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSkill === '' || currentLevel === '' || targetLevel === '') {
      setSubmitError('Please fill out all required fields.');
      return;
    }
    if (currentLevel < 0 || currentLevel > 5 || targetLevel < 0 || targetLevel > 5) {
      setSubmitError('Levels must be between 0 and 5.');
      return;
    }
    
    setSubmitting(true);
    setSubmitError('');
    setSuccess(false);
    
    try {
      await apiPut('/assessments', {
        skill_id: Number(selectedSkill),
        current_level: Number(currentLevel),
        target_level: Number(targetLevel),
        confidence: Number(confidence)
      });
      setSuccess(true);
      setCurrentLevel('');
      setTargetLevel('');
      setSelectedSkill('');
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to submit assessment.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <header>
        <div>
          <p className="eyebrow">Assessments</p>
          <h1>Record Proficiency</h1>
          <p className="muted">Update your current and target capability levels.</p>
        </div>
      </header>

      <section className="grid" style={{ gridTemplateColumns: '1fr', maxWidth: '600px', margin: '0' }}>
        {loading && <div className="panel"><p>Loading skills...</p></div>}
        
        {error && !loading && (
          <div className="panel" style={{ borderLeft: '4px solid red' }}>
            <h2>Could not load skills</h2>
            <p>Please check your connection and try again.</p>
          </div>
        )}

        {!loading && !error && skills.length === 0 && (
          <div className="panel">
            <h2>No skills found</h2>
            <p className="muted">There are no skills available for assessment.</p>
          </div>
        )}

        {!loading && !error && skills.length > 0 && (
          <div className="panel">
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: 'bold' }}>Skill</label>
                <select 
                  value={selectedSkill} 
                  onChange={e => setSelectedSkill(e.target.value === '' ? '' : Number(e.target.value))}
                  required
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)' }}
                >
                  <option value="">-- Select a Skill --</option>
                  {skills.map(skill => (
                    <option key={skill.id} value={skill.id}>{skill.name}</option>
                  ))}
                </select>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: 'bold' }}>Current Level (0-5)</label>
                  <input 
                    type="number" 
                    step="0.5"
                    min="0"
                    max="5"
                    value={currentLevel} 
                    onChange={e => setCurrentLevel(e.target.value === '' ? '' : Number(e.target.value))} 
                    required 
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: 'bold' }}>Target Level (0-5)</label>
                  <input 
                    type="number" 
                    step="0.5"
                    min="0"
                    max="5"
                    value={targetLevel} 
                    onChange={e => setTargetLevel(e.target.value === '' ? '' : Number(e.target.value))} 
                    required 
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)' }}
                  />
                </div>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: 'bold' }}>Confidence ({confidence})</label>
                <input 
                  type="range" 
                  min="0"
                  max="1"
                  step="0.1"
                  value={confidence} 
                  onChange={e => setConfidence(Number(e.target.value))} 
                  style={{ width: '100%' }}
                />
              </div>

              {submitError && <div style={{ color: 'red', fontSize: '0.875rem', padding: '0.5rem', background: '#ffebee', borderRadius: '4px' }}>{submitError}</div>}
              {success && <div style={{ color: 'green', fontSize: '0.875rem', padding: '0.5rem', background: '#e8f5e9', borderRadius: '4px' }}>Assessment saved successfully!</div>}
              
              <button type="submit" className="primary" disabled={submitting} style={{ marginTop: '0.5rem' }}>
                {submitting ? 'Saving...' : 'Save Assessment'}
              </button>
            </form>
          </div>
        )}
      </section>
    </>
  );
}
