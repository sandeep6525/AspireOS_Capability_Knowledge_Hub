import {useState, useEffect} from 'react';
import {api, apiPatch, apiPost, User} from '../lib/api';

export function Settings() {
  const [user, setUser] = useState<User | null>(null);
  
  // Profile state
  const [name, setName] = useState('');
  const [locale, setLocale] = useState('');
  
  // Preferences state
  const [interestsText, setInterestsText] = useState('');
  const [consentAnalytics, setConsentAnalytics] = useState(false);
  
  // Security state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Status state
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  const fetchUser = () => {
    setLoading(true);
    api<User>('/me')
      .then(u => {
        setUser(u);
        setName(u.name || '');
        setLocale(u.locale || 'en');
        setInterestsText(u.interests?.join(', ') || '');
        setConsentAnalytics(u.consent_analytics || false);
      })
      .catch(e => setMessage({type: 'error', text: e.message}))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setMessage(null);
    try {
      await apiPatch('/me', {name, locale});
      setMessage({type: 'success', text: 'Profile updated successfully'});
      fetchUser();
    } catch (e: any) {
      setMessage({type: 'error', text: e.message});
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPrefs(true);
    setMessage(null);
    const interests = interestsText.split(',').map(s => s.trim()).filter(s => s.length > 0);
    try {
      await apiPatch('/me', {interests, consent_analytics: consentAnalytics});
      setMessage({type: 'success', text: 'Preferences updated successfully'});
      fetchUser();
    } catch (e: any) {
      setMessage({type: 'error', text: e.message});
    } finally {
      setSavingPrefs(false);
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage({type: 'error', text: 'New passwords do not match'});
      return;
    }
    setSavingPassword(true);
    setMessage(null);
    try {
      await apiPost('/me/password', {current_password: currentPassword, new_password: newPassword});
      setMessage({type: 'success', text: 'Password updated successfully'});
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (e: any) {
      setMessage({type: 'error', text: e.message});
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) return <div style={{padding: '2rem'}}>Loading settings...</div>;
  if (!user) return <div style={{padding: '2rem'}}>Failed to load user.</div>;

  return (
    <>
      <header>
        <div>
          <p className="eyebrow">User</p>
          <h1>Settings</h1>
        </div>
      </header>
      
      <section className="grid" style={{maxWidth: '800px'}}>
        {message && (
          <div className="panel span2" style={{borderLeft: `4px solid ${message.type === 'success' ? 'green' : 'red'}`}}>
            <p style={{color: message.type === 'success' ? 'green' : 'red', margin: 0}}>{message.text}</p>
          </div>
        )}

        <div className="panel span2">
          <h2>Profile</h2>
          <form onSubmit={handleSaveProfile} style={{display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem'}}>
            <label>
              Display Name
              <input type="text" value={name} onChange={e => setName(e.target.value)} required />
            </label>
            <label>
              Locale
              <select value={locale} onChange={e => setLocale(e.target.value)}>
                <option value="en">English (en)</option>
                <option value="fr">French (fr)</option>
                <option value="es">Spanish (es)</option>
                <option value="de">German (de)</option>
              </select>
            </label>
            <button type="submit" disabled={savingProfile} style={{alignSelf: 'flex-start'}}>
              {savingProfile ? 'Saving...' : 'Save Profile'}
            </button>
          </form>
        </div>

        <div className="panel span2">
          <h2>Preferences</h2>
          <form onSubmit={handleSavePreferences} style={{display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem'}}>
            <label>
              Learning Interests (comma-separated)
              <input type="text" value={interestsText} onChange={e => setInterestsText(e.target.value)} placeholder="e.g. Data Science, Leadership" />
            </label>
            <label style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
              <input type="checkbox" checked={consentAnalytics} onChange={e => setConsentAnalytics(e.target.checked)} />
              Allow analytics tracking for personalized recommendations
            </label>
            <button type="submit" disabled={savingPrefs} style={{alignSelf: 'flex-start'}}>
              {savingPrefs ? 'Saving...' : 'Save Preferences'}
            </button>
          </form>
        </div>

        <div className="panel span2">
          <h2>Security</h2>
          <form onSubmit={handleSavePassword} style={{display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem'}}>
            <label>
              Current Password
              <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required />
            </label>
            <label>
              New Password
              <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} minLength={8} required />
            </label>
            <label>
              Confirm New Password
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} minLength={8} required />
            </label>
            <button type="submit" disabled={savingPassword} style={{alignSelf: 'flex-start'}}>
              {savingPassword ? 'Saving...' : 'Change Password'}
            </button>
          </form>
        </div>
      </section>
    </>
  );
}
