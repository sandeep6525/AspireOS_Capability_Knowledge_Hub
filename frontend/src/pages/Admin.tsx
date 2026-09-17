import {useEffect, useState} from 'react';
import {api, apiPost, apiPut} from '../lib/api';

export function AdminOverview() {
  const [sources, setSources] = useState<any[]>([]);
  const [content, setContent] = useState<any[]>([]);
  const [audit, setAudit] = useState<any[]>([]);
  
  useEffect(() => {
    api<any[]>('/admin/sources').then(data => setSources(data || [])).catch(() => {});
    api<any[]>('/admin/content').then(data => setContent(data || [])).catch(() => {});
    api<any[]>('/admin/audit').then(data => setAudit(data || [])).catch(() => {});
  }, []);
  
  const pending = content.filter(c => c.status === 'pending_review');
  const approved = content.filter(c => c.status === 'approved');

  const latestAudit = audit && audit.length > 0 ? audit[0] : null;
  const displayAction = latestAudit && latestAudit.action ? latestAudit.action : 'N/A';

  return (
    <>
      <header>
        <div>
          <p className="eyebrow">Admin</p>
          <h1>Overview</h1>
        </div>
      </header>
      <section className="stats">
        <div className="stat"><div><b>{sources.length}</b><small>Registered Sources</small></div></div>
        <div className="stat"><div><b>{pending.length}</b><small>Pending Review</small></div></div>
        <div className="stat"><div><b>{approved.length}</b><small>Approved Content</small></div></div>
        <div className="stat"><div><b style={{fontSize: latestAudit ? '1.2rem' : '2rem'}}>{displayAction}</b><small>Recent Audit Activity</small></div></div>
      </section>
    </>
  );
}

export function AdminSources() {
  const [sources, setSources] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    api<any[]>('/admin/sources').then(setSources).catch(() => {});
  }, []);

  const handleIngest = async (id: number) => {
    setLoading(true);
    setResult(null);
    try {
      const token = localStorage.getItem('token');
      const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
      const r = await fetch(`${BASE}/admin/sources/${id}/ingest`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await r.json().catch(() => null);
      if (!r.ok) {
        setResult(data || { status: 'error', source_name: 'Unknown', error_code: 'UNKNOWN', message: `Request failed: ${r.status}` });
      } else {
        setResult(data);
      }
    } catch (e: any) {
      setResult({ status: 'error', source_name: 'Unknown', error_code: 'NETWORK_ERROR', message: e.message });
    } finally {
      setLoading(false);
    }
  };

  const renderResult = () => {
    if (!result) return null;
    if (result.status === 'success') {
      return (
        <div style={{ padding: '1rem', marginBottom: '1rem', borderLeft: '4px solid green', backgroundColor: '#e8f5e9' }}>
          <h4 style={{ color: 'green', margin: '0 0 0.5rem 0' }}>✓ Ingestion completed</h4>
          <p style={{ margin: '0.25rem 0' }}><strong>Source:</strong> {result.source_name}</p>
          <p style={{ margin: '0.25rem 0' }}><strong>New items:</strong> {result.created}</p>
          <p style={{ margin: '0.25rem 0' }}><strong>Duplicates skipped:</strong> {result.duplicates}</p>
        </div>
      );
    } else {
      const isConfigError = result.error_code === 'FEED_NOT_CONFIGURED';
      return (
        <div style={{ padding: '1rem', marginBottom: '1rem', borderLeft: isConfigError ? '4px solid orange' : '4px solid red', backgroundColor: isConfigError ? '#fff3e0' : '#ffebee' }}>
          <h4 style={{ color: isConfigError ? 'darkorange' : 'red', margin: '0 0 0.5rem 0' }}>
            {isConfigError ? '⚠ Ingestion unavailable' : `❌ ${result.source_name || 'Source'} ingestion failed`}
          </h4>
          <p style={{ margin: '0.25rem 0' }}><strong>Reason:</strong> {result.message}</p>
          {!isConfigError && <p style={{ margin: '0.25rem 0' }}><strong>Source:</strong> {result.source_name}</p>}
          <p style={{ margin: '0.25rem 0' }}>No content was imported.</p>
        </div>
      );
    }
  };

  return (
    <>
      <header>
        <div>
          <p className="eyebrow">Admin</p>
          <h1>Sources</h1>
        </div>
      </header>
      <section className="panel" style={{margin: '2rem'}}>
        {renderResult()}
        <table style={{width: '100%', textAlign: 'left'}}>
          <thead><tr><th>ID</th><th>Name</th><th>Trust Tier</th><th>Action</th></tr></thead>
          <tbody>
            {sources.map(s => (
              <tr key={s.id}>
                <td>{s.id}</td>
                <td>{s.name}</td>
                <td>{s.trust_tier}</td>
                <td>
                  <button onClick={() => handleIngest(s.id)} disabled={loading}>Ingest</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}

export function AdminContent() {
  const [content, setContent] = useState<any[]>([]);

  const fetchContent = () => {
    api<any[]>('/admin/content?status=pending_review').then(setContent).catch(() => {});
  };

  useEffect(() => {
    fetchContent();
  }, []);

  const handleApprove = async (id: number) => {
    try {
      // NOTE: Using PATCH. We need apiPatch or just use fetch directly. Wait, api.ts doesn't have apiPatch.
      const token=localStorage.getItem('token');
      const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
      const r = await fetch(`${BASE}/admin/content/${id}/approve`, {
        method: 'PATCH',
        headers: {Authorization: `Bearer ${token}`}
      });
      if (!r.ok) throw new Error('Failed to approve');
      fetchContent();
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <>
      <header>
        <div>
          <p className="eyebrow">Admin</p>
          <h1>Content Review</h1>
        </div>
      </header>
      <section className="panel" style={{margin: '2rem'}}>
        {content.length === 0 ? <p>No pending content.</p> : (
          <table style={{width: '100%', textAlign: 'left'}}>
            <thead><tr><th>ID</th><th>Title</th><th>Source ID</th><th>Action</th></tr></thead>
            <tbody>
              {content.map(c => (
                <tr key={c.id}>
                  <td>{c.id}</td>
                  <td><a href={c.canonical_url} target="_blank">{c.title}</a></td>
                  <td>{c.source_id}</td>
                  <td>
                    <button onClick={() => handleApprove(c.id)}>Approve</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}

export function AdminAudit() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    api<any[]>('/admin/audit')
      .then(data => setLogs(data))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <header>
        <div>
          <p className="eyebrow">Admin</p>
          <h1>Audit History</h1>
        </div>
      </header>
      <section className="panel" style={{margin: '2rem'}}>
        {loading && <p>Loading audit logs...</p>}
        {error && <p style={{color: 'red'}}>Error loading logs: {error}</p>}
        {!loading && !error && logs.length === 0 && <p>No audit records found.</p>}
        {!loading && !error && logs.length > 0 && (
          <table style={{width: '100%', textAlign: 'left'}}>
            <thead><tr><th>Timestamp</th><th>Actor ID</th><th>Action</th><th>Target Type</th><th>Target ID</th></tr></thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id}>
                  <td>{new Date(log.timestamp).toLocaleString()}</td>
                  <td>{log.actor_id}</td>
                  <td>{log.action}</td>
                  <td>{log.target_type}</td>
                  <td>{log.target_id}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}

export function AdminEvidence() {
  const [evidenceList, setEvidenceList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{type: 'success'|'error', text: string} | null>(null);

  const fetchEvidence = () => {
    setLoading(true);
    api<any[]>('/evidence')
      .then(data => setEvidenceList(data.filter(e => e.status === 'pending')))
      .catch(e => setMessage({type: 'error', text: e.message}))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchEvidence();
  }, []);

  const handleVerify = async (id: number, status: 'verified' | 'rejected', level?: number) => {
    try {
      const payload: any = { status };
      if (status === 'verified' && level !== undefined) {
        payload.verified_level = level;
      }
      
      const token = localStorage.getItem('token');
      const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
      const r = await fetch(`${BASE}/admin/evidence/${id}/verify`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      if (!r.ok) {
        const errorData = await r.json();
        throw new Error(errorData.detail || 'Failed to verify evidence');
      }
      
      setMessage({type: 'success', text: `Evidence ${status} successfully.`});
      fetchEvidence();
    } catch (e: any) {
      setMessage({type: 'error', text: e.message});
    }
  };

  return (
    <>
      <header>
        <div>
          <p className="eyebrow">Admin</p>
          <h1>Evidence Review</h1>
          <p className="muted">Review pending evidence submissions and grant verified capability levels.</p>
        </div>
      </header>
      <section className="panel" style={{margin: '2rem'}}>
        {message && (
          <div style={{ padding: '1rem', marginBottom: '1rem', borderLeft: `4px solid ${message.type === 'success' ? 'green' : 'red'}`, backgroundColor: message.type === 'success' ? '#e8f5e9' : '#ffebee' }}>
            <p style={{ color: message.type === 'success' ? 'green' : 'red', margin: 0 }}>{message.text}</p>
          </div>
        )}
        
        {loading && <p>Loading pending evidence...</p>}
        
        {!loading && evidenceList.length === 0 && <p>No pending evidence to review.</p>}
        
        {!loading && evidenceList.length > 0 && (
          <div className="table-responsive">
            <table style={{width: '100%', textAlign: 'left'}}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>User ID</th>
                  <th>Skill ID</th>
                  <th>Description</th>
                  <th>URL</th>
                  <th>Submitted At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {evidenceList.map(ev => (
                  <tr key={ev.id}>
                    <td>{ev.id}</td>
                    <td>{ev.user_id}</td>
                    <td>{ev.skill_id}</td>
                    <td>{ev.description}</td>
                    <td><a href={ev.url} target="_blank" rel="noreferrer">View Evidence</a></td>
                    <td>{new Date(ev.created_at).toLocaleString()}</td>
                    <td>
                      <div style={{display: 'flex', gap: '0.5rem', alignItems: 'center'}}>
                        <select id={`level-${ev.id}`} style={{padding: '0.25rem'}}>
                          <option value="">-- Level --</option>
                          <option value="1">1</option>
                          <option value="2">2</option>
                          <option value="3">3</option>
                          <option value="4">4</option>
                          <option value="5">5</option>
                        </select>
                        <button 
                          className="primary" 
                          style={{padding: '0.25rem 0.5rem'}}
                          onClick={() => {
                            const levelInput = document.getElementById(`level-${ev.id}`) as HTMLSelectElement;
                            if (!levelInput.value) {
                              setMessage({type: 'error', text: 'Please select a verified level to approve.'});
                              return;
                            }
                            handleVerify(ev.id, 'verified', Number(levelInput.value));
                          }}
                        >
                          Approve
                        </button>
                        <button 
                          style={{padding: '0.25rem 0.5rem', backgroundColor: 'var(--surface-sunken)', color: 'red'}}
                          onClick={() => handleVerify(ev.id, 'rejected')}
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
