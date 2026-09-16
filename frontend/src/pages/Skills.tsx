import { useEffect, useState } from 'react';
import { api, Skill, Gap } from '../lib/api';

type SkillWithProficiency = Skill & { current?: number; target?: number };

export function Skills() {
  const [skills, setSkills] = useState<SkillWithProficiency[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    Promise.all([
      api<Skill[]>('/skills'),
      api<Gap[]>('/skill-gaps').catch(() => [] as Gap[]) // Fallback if gaps fail
    ])
      .then(([skillsData, gapsData]) => {
        const merged = skillsData.map(skill => {
          const gap = gapsData.find(g => g.skill === skill.name);
          return { ...skill, current: gap?.current, target: gap?.target };
        });
        setSkills(merged);
        setError(false);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  // Group skills by category
  const groupedSkills = skills.reduce((acc, skill) => {
    if (!acc[skill.category]) acc[skill.category] = [];
    acc[skill.category].push(skill);
    return acc;
  }, {} as Record<string, SkillWithProficiency[]>);

  return (
    <>
      <header>
        <div>
          <p className="eyebrow">Skills</p>
          <h1>Capability Framework</h1>
          <p className="muted">Explore the skills required for your role and track your proficiency.</p>
        </div>
      </header>

      <section className="grid" style={{ gridTemplateColumns: '1fr', maxWidth: '800px', margin: '0' }}>
        {loading && <div className="panel"><p>Loading skills...</p></div>}
        
        {error && !loading && (
          <div className="panel" style={{ borderLeft: '4px solid red' }}>
            <h2>Could not load skills</h2>
            <p>Please check your connection and try again.</p>
          </div>
        )}

        {!loading && !error && Object.keys(groupedSkills).length === 0 && (
          <div className="panel">
            <h2>No skills found</h2>
            <p className="muted">There are currently no skills configured in the system.</p>
          </div>
        )}

        {!loading && !error && Object.entries(groupedSkills).map(([category, catSkills]) => (
          <div key={category} style={{ marginBottom: '2rem' }}>
            <h2 style={{ marginBottom: '1rem' }}>{category}</h2>
            <div style={{ display: 'grid', gap: '1rem' }}>
              {catSkills.map(skill => (
                <div className="panel" key={skill.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h3 style={{ margin: '0 0 0.5rem 0' }}>{skill.name}</h3>
                      <p className="muted" style={{ margin: '0 0 1rem 0' }}>{skill.description}</p>
                    </div>
                    <span className="tags" style={{ margin: 0 }}><span>{skill.code}</span></span>
                  </div>
                  
                  {skill.target !== undefined && skill.current !== undefined ? (
                    <div className="skill">
                      <div>
                        <strong>Proficiency</strong>
                        <small>{skill.current} → {skill.target} target</small>
                      </div>
                      <div className="bar" style={{ marginTop: '0.5rem' }}>
                        <i style={{ width: `${(skill.current / skill.target) * 100}%` }} />
                      </div>
                    </div>
                  ) : (
                    <div className="skill">
                      <div>
                        <strong>Proficiency</strong>
                        <small>Not Assessed</small>
                      </div>
                      <div className="bar" style={{ marginTop: '0.5rem' }}>
                        <i style={{ width: '0%' }} />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>
    </>
  );
}
