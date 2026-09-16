import { useEffect, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { api, Content } from '../lib/api';

export function Updates() {
  const [feed, setFeed] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    api<Content[]>('/feed')
      .then((data) => {
        setFeed(data);
        setError(false);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <header>
        <div>
          <p className="eyebrow">Updates</p>
          <h1>Evidence-based feed</h1>
          <p className="muted">Latest authoritative resources mapped to your role and gaps.</p>
        </div>
      </header>
      
      <section className="grid" style={{ gridTemplateColumns: '1fr', maxWidth: '800px', margin: '0' }}>
        {loading && <div className="panel"><p>Loading feed...</p></div>}
        
        {error && !loading && (
          <div className="panel" style={{ borderLeft: '4px solid red' }}>
            <h2>Could not load updates</h2>
            <p>Please check your connection and try again.</p>
          </div>
        )}

        {!loading && !error && feed.length === 0 && (
          <div className="panel">
            <h2>You're all caught up!</h2>
            <p className="muted">No new updates right now. Check back later.</p>
          </div>
        )}

        {!loading && !error && feed.map(item => (
          <article className="resource panel" key={item.id} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <div className="resourceIcon">{item.resource_type[0]?.toUpperCase() || 'R'}</div>
            <div style={{ flex: 1 }}>
              <div className="tags">
                <span>{item.resource_type}</span>
                {item.topics.map(x => <span key={x}>{x}</span>)}
              </div>
              <h3 style={{ margin: '0.5rem 0' }}>{item.title}</h3>
              <p style={{ margin: '0 0 1rem 0' }}>{item.abstract}</p>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.875rem' }}>
                <a href={item.canonical_url} target="_blank" rel="noreferrer" className="link" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  Open official source <ArrowUpRight size={14}/>
                </a>
                {item.published_at && (
                  <span className="muted">
                    {new Date(item.published_at).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          </article>
        ))}
      </section>
    </>
  );
}
