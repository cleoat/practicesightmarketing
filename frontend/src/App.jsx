import { useState, useEffect } from 'react';
import MetricsBar from './components/MetricsBar';
import PipelineView from './components/PipelineView';
import SettingsPanel from './components/SettingsPanel';
import CommunitiesPanel, { COMMUNITIES } from './components/CommunitiesPanel';
import { PostTemplatesPanel } from './components/PostTemplatesPanel';
import { inferChannelFromText } from './lib/communityRules';
import {
  getLeads, setLeads,
  getSettings, setSettings,
  getRedditStats, incrementPostsToday, resetDailyStats
} from './lib/storage';
import { COLORS, DEFAULT_LEAD, SPAM_KEYWORDS, STAGES, CHANNELS } from './lib/constants';
import { validateInput, leadSchema } from './lib/validators';

function App() {
  const [leads, setLeadsState] = useState([]);
  const [settings, setSettingsState] = useState({});
  const [redditStats, setRedditStatsState] = useState({});
  const [inputName, setInputName] = useState('');
  const [inputSource, setInputSource] = useState('');
  const [inputChannel, setInputChannel] = useState('reddit');
  const [inputThreadUrl, setInputThreadUrl] = useState('');
  const [inputComment, setInputComment] = useState('');
  const [msg, setMsg] = useState('');
  const [filter, setFilter] = useState('all');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLeadsState(getLeads());
    setSettingsState(getSettings());
    setRedditStatsState(resetDailyStats());
    setLoaded(true);
  }, []);

  useEffect(() => { if (loaded) setLeads(leads); }, [leads, loaded]);
  useEffect(() => { if (loaded) setSettings(settings); }, [settings, loaded]);

  function detectStage(comment) {
    const lower = comment.toLowerCase();
    if (lower.includes('unbilled') || lower.includes('stuck') || lower.includes('aging') || lower.includes('billing')) return 'warm';
    if (/want to try|how do i|how much|sign up|get started|interested in/.test(lower)) return 'hot';
    if (lower.includes('been using') || lower.includes('tried it') || lower.includes('tested')) return 'testing';
    if (lower.includes('it worked') || lower.includes('solved') || lower.includes('feedback')) return 'feedback';
    if (lower.includes('headway') || lower.includes('alma')) return 'not_fit';
    if (lower.includes('?')) return 'engaged';
    return 'saw_it';
  }

  function handleCommunitySelect(name, channel) {
    setInputSource(name);
    setInputChannel(channel);
  }

  function handleSourceChange(value) {
    setInputSource(value);
    const inferred = inferChannelFromText(value, COMMUNITIES);
    if (inferred && inferred !== inputChannel) setInputChannel(inferred);
  }

  function handleThreadUrlChange(value) {
    setInputThreadUrl(value);
    const inferred = inferChannelFromText(value, COMMUNITIES);
    if (inferred && inferred !== inputChannel) setInputChannel(inferred);
  }

  function handleAddLead() {
    const name = inputName.trim();
    const comment = inputComment.trim();

    if (!name || !comment) {
      setMsg('❌ Need a name and their comment');
      setTimeout(() => setMsg(''), 2000);
      return;
    }

    const clean = { ...DEFAULT_LEAD, name, comment };
    const validation = validateInput(leadSchema, clean);
    if (!validation.valid) {
      setMsg(`❌ ${validation.error}`);
      setTimeout(() => setMsg(''), 2000);
      return;
    }

    if (SPAM_KEYWORDS.some(k => comment.toLowerCase().includes(k))) {
      setMsg('⚠️ Spam keyword detected');
      setTimeout(() => setMsg(''), 2000);
      return;
    }

    const stage = detectStage(comment);
    const newLead = {
      ...DEFAULT_LEAD,
      name,
      comment,
      stage,
      ch: inputChannel,
      source: inputSource.trim(),
      threadUrl: inputThreadUrl.trim(),
      id: Date.now()
    };
    setLeadsState([newLead, ...leads]);
    setInputName('');
    setInputComment('');
    setInputThreadUrl('');
    setMsg('✓ Added');
    setTimeout(() => setMsg(''), 1500);
  }

  function handleUpdateLead(id, updates) {
    setLeadsState(leads.map(l => l.id === id ? { ...l, ...updates } : l));
  }

  function handleDeleteLead(id) {
    setLeadsState(leads.filter(l => l.id !== id));
  }

  function handleReply(id, followUpText) {
    if (!followUpText.trim()) return;
    const lead = leads.find(l => l.id === id);
    const followUps = [...(lead?.followUps || []), followUpText.trim()];
    handleUpdateLead(id, { followUps });
    setMsg('✓ Follow-up logged');
    setTimeout(() => setMsg(''), 1500);
  }

  function handleMarkPosted(id) {
    handleUpdateLead(id, { posted: true });
    const newStats = incrementPostsToday();
    setRedditStatsState({ ...newStats });
  }

  function handleUpdateSetting(key, value) {
    setSettingsState({ ...settings, [key]: value });
  }

  if (!loaded) {
    return (
      <div style={{
        fontFamily: "'DM Sans', system-ui, sans-serif",
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        height: '100vh', background: COLORS.bg, color: COLORS.muted
      }}>
        Loading...
      </div>
    );
  }

  const inputStyle = {
    width: '100%', padding: '9px 12px', fontSize: 13,
    border: `1px solid ${COLORS.border}`, borderRadius: 8,
    boxSizing: 'border-box', fontFamily: 'inherit'
  };

  return (
    <div style={{
      fontFamily: "'DM Sans', system-ui, sans-serif",
      color: COLORS.text, background: COLORS.bg,
      minHeight: '100vh', padding: 16
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.5px', marginBottom: 4 }}>
              PracticeSight Outreach
            </div>
            <div style={{ fontSize: 12, color: COLORS.muted }}>
              Find billing-frustrated therapists → generate reply → copy & paste → track
            </div>
          </div>
          <SettingsPanel settings={settings} onUpdate={handleUpdateSetting} />
        </div>

        {/* Metrics */}
        <MetricsBar leads={leads} redditStats={redditStats} />

        {/* Communities */}
        <CommunitiesPanel onSelect={handleCommunitySelect} />

        {/* Post Templates */}
        <PostTemplatesPanel
          apiKey={settings.openrouterApiKey}
          preferredModel={settings.openrouterModel}
        />

        {/* Add lead */}
        <div style={{
          background: '#fff', border: `1px solid ${COLORS.border}`,
          borderRadius: 12, padding: 16, marginBottom: 20
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.muted, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
            Add a lead
          </div>

          {/* Row 1: Name + Channel + Source */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 8, marginBottom: 8 }}>
            <input
              type="text"
              placeholder="Name or handle (e.g. u/Visual-Few)"
              value={inputName}
              onChange={(e) => setInputName(e.target.value)}
              style={inputStyle}
            />

            {/* Channel pills */}
            <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
              {['reddit', 'facebook', 'x', 'linkedin'].map(ch => (
                <button
                  key={ch}
                  onClick={() => setInputChannel(ch)}
                  style={{
                    padding: '7px 12px', fontSize: 12, fontWeight: 600,
                    border: inputChannel === ch ? `2px solid ${CHANNELS[ch].color}` : `1px solid ${COLORS.border}`,
                    background: inputChannel === ch ? CHANNELS[ch].color + '15' : '#fff',
                    color: inputChannel === ch ? CHANNELS[ch].color : COLORS.muted,
                    borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {CHANNELS[ch].icon} {CHANNELS[ch].label}
                </button>
              ))}
            </div>

            <input
              type="text"
              placeholder="Source (e.g. r/therapists)"
              value={inputSource}
              onChange={(e) => handleSourceChange(e.target.value)}
              style={{ ...inputStyle, color: inputSource ? COLORS.accent : undefined }}
            />
          </div>

          {/* Row 2: Thread URL */}
          <input
            type="text"
            placeholder="Thread URL (optional — paste link to their post so you can find it later)"
            value={inputThreadUrl}
            onChange={(e) => handleThreadUrlChange(e.target.value)}
            style={{ ...inputStyle, marginBottom: 8, fontSize: 12, color: COLORS.secondary }}
          />

          {/* Row 3: Comment */}
          <textarea
            placeholder="Paste their comment here..."
            value={inputComment}
            onChange={(e) => setInputComment(e.target.value)}
            onKeyDown={(e) => e.ctrlKey && e.key === 'Enter' && handleAddLead()}
            rows={3}
            style={{ ...inputStyle, marginBottom: 10, resize: 'vertical' }}
          />

          <button onClick={handleAddLead} style={{
            width: '100%', fontSize: 14, fontWeight: 600, padding: 12,
            background: COLORS.primary, color: '#fff', border: 'none',
            borderRadius: 9, cursor: 'pointer', fontFamily: 'inherit'
          }}>
            + Add lead (Ctrl+Enter)
          </button>

          {msg && (
            <div style={{
              fontSize: 12, marginTop: 10, padding: '8px 12px', borderRadius: 8,
              background: msg.includes('❌') ? '#FFE5E5' : msg.includes('⚠️') ? '#FFFBF0' : '#E5F5EB',
              color: msg.includes('❌') ? '#C44' : msg.includes('⚠️') ? '#854F0B' : '#166534',
              textAlign: 'center', fontWeight: 600
            }}>
              {msg}
            </div>
          )}
        </div>

        {/* Stage filters */}
        <div style={{
          display: 'flex', gap: 8, marginBottom: 20,
          overflowX: 'auto', paddingBottom: 8
        }}>
          <button onClick={() => setFilter('all')} style={{
            padding: '8px 16px',
            border: filter === 'all' ? '2px solid #111' : '1px solid #DDD',
            background: filter === 'all' ? '#111' : '#fff',
            color: filter === 'all' ? '#fff' : '#555',
            borderRadius: 20, fontSize: 12, fontWeight: 600,
            cursor: 'pointer', whiteSpace: 'nowrap'
          }}>
            All ({leads.length})
          </button>
          {STAGES.map(s => {
            const count = leads.filter(l => l.stage === s.id).length;
            return (
              <button key={s.id} onClick={() => setFilter(s.id)} style={{
                padding: '8px 14px',
                border: filter === s.id ? `2px solid ${s.color}` : '1px solid #DDD',
                background: filter === s.id ? s.color + '10' : '#fff',
                color: s.color, borderRadius: 20, fontSize: 11,
                fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap'
              }}>
                {s.label} ({count})
              </button>
            );
          })}
        </div>

        {/* Pipeline */}
        <PipelineView
          leads={leads}
          onUpdate={handleUpdateLead}
          onDelete={handleDeleteLead}
          onReply={handleReply}
          onMarkPosted={handleMarkPosted}
          filter={filter}
          apiKey={settings.openrouterApiKey}
          preferredModel={settings.openrouterModel}
        />
      </div>
    </div>
  );
}

export default App;
