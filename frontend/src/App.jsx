import { useState, useEffect } from 'react';
import MetricsBar from './components/MetricsBar';
import ActionQueue from './components/ActionQueue';
import PipelineView from './components/PipelineView';
import SettingsPanel from './components/SettingsPanel';
import CommunitiesPanel, { COMMUNITIES } from './components/CommunitiesPanel';
import { PostTemplatesPanel } from './components/PostTemplatesPanel';
import { analyzeLeadComment } from './lib/leadAnalysis';
import { inferChannelFromText } from './lib/communityRules';
import {
  getLeads, setLeads,
  getSettings, setSettings,
  getRedditStats, incrementPostsToday, resetDailyStats
} from './lib/storage';
import { APP_BUILD_LABEL, COLORS, DEFAULT_LEAD, SPAM_KEYWORDS, STAGES, CHANNELS } from './lib/constants';
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

  const inputAnalysis = analyzeLeadComment(inputComment);

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

    const analysis = analyzeLeadComment(comment);
    const newLead = {
      ...DEFAULT_LEAD,
      name,
      comment,
      stage: analysis.stage,
      leadType: analysis.leadType,
      responseType: analysis.responseType,
      intent: analysis.intent,
      analysisReason: analysis.reason,
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
    width: '100%', padding: '12px 14px', fontSize: 15,
    border: `1px solid ${COLORS.border}`, borderRadius: 8,
    boxSizing: 'border-box', fontFamily: 'inherit',
    color: COLORS.text,
    background: '#fff'
  };

  return (
    <div style={{
      fontFamily: "'DM Sans', system-ui, sans-serif",
      color: COLORS.text, background: COLORS.bg,
      minHeight: '100vh', padding: 20
    }}>
      <div style={{ maxWidth: 1320, margin: '0 auto' }}>

        {/* Header */}
        <div style={{
          marginBottom: 20,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 16,
          padding: '18px 20px',
          background: '#fff',
          border: `1px solid ${COLORS.border}`,
          borderRadius: 8,
          boxShadow: '0 12px 30px rgba(15, 23, 42, 0.06)'
        }}>
          <div>
            <div style={{ fontSize: 30, fontWeight: 900, marginBottom: 5 }}>
              PracticeSight Outreach
            </div>
            <div style={{ fontSize: 15, color: COLORS.muted, fontWeight: 700 }}>
              Find billing-frustrated therapists → generate reply → copy & paste → track
            </div>
            <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 6, fontWeight: 700 }}>
              Build: {APP_BUILD_LABEL}
            </div>
          </div>
          <SettingsPanel settings={settings} onUpdate={handleUpdateSetting} />
        </div>

        {/* Metrics */}
        <MetricsBar leads={leads} redditStats={redditStats} />

        {/* Action Queue */}
        <ActionQueue leads={leads} />

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
          borderRadius: 8, padding: 18, marginBottom: 20,
          boxShadow: '0 10px 26px rgba(15, 23, 42, 0.06)'
        }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: COLORS.text, marginBottom: 12 }}>
            Add a lead
          </div>

          {/* Row 1: Name + Channel + Source */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 10, marginBottom: 10 }}>
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
                    padding: '10px 13px', fontSize: 14, fontWeight: 800,
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
            style={{ ...inputStyle, marginBottom: 10, color: COLORS.secondary }}
          />

          {/* Row 3: Comment */}
          <textarea
            placeholder="Paste their comment here..."
            value={inputComment}
            onChange={(e) => setInputComment(e.target.value)}
            onKeyDown={(e) => e.ctrlKey && e.key === 'Enter' && handleAddLead()}
            rows={4}
            style={{ ...inputStyle, marginBottom: 10, resize: 'vertical' }}
          />

          {inputComment.trim().length > 4 && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(160px, 0.7fr) minmax(220px, 1.3fr)',
              gap: 10,
              alignItems: 'center',
              padding: 12,
              marginBottom: 10,
              borderRadius: 8,
              border: `1px solid ${inputAnalysis.stage === 'not_fit' ? '#FECACA' : COLORS.border}`,
              background: inputAnalysis.stage === 'not_fit' ? '#FEF2F2' : '#F8FAFC',
            }}>
              <div>
                <div style={{ fontSize: 12, color: COLORS.muted, fontWeight: 800, textTransform: 'uppercase', marginBottom: 4 }}>
                  Analyzer
                </div>
                <div style={{
                  fontSize: 15,
                  fontWeight: 900,
                  color: inputAnalysis.stage === 'not_fit' ? COLORS.error : COLORS.text,
                }}>
                  {inputAnalysis.responseType}
                </div>
              </div>
              <div style={{ fontSize: 14, lineHeight: 1.45, color: COLORS.text }}>
                <strong>Stage:</strong> {STAGES.find(s => s.id === inputAnalysis.stage)?.label || inputAnalysis.stage}
                <span style={{ color: COLORS.muted }}> · {inputAnalysis.reason}</span>
              </div>
            </div>
          )}

          <button onClick={handleAddLead} style={{
            width: '100%', fontSize: 16, fontWeight: 900, padding: 14,
            background: COLORS.primary, color: '#fff', border: 'none',
            borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit'
          }}>
            + Add lead (Ctrl+Enter)
          </button>

          {msg && (
            <div style={{
              fontSize: 14, marginTop: 10, padding: '10px 12px', borderRadius: 8,
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
            padding: '10px 16px',
            border: filter === 'all' ? '2px solid #111' : '1px solid #DDD',
            background: filter === 'all' ? '#111' : '#fff',
            color: filter === 'all' ? '#fff' : '#555',
            borderRadius: 8, fontSize: 14, fontWeight: 800,
            cursor: 'pointer', whiteSpace: 'nowrap'
          }}>
            All ({leads.length})
          </button>
          {STAGES.map(s => {
            const count = leads.filter(l => l.stage === s.id).length;
            return (
              <button key={s.id} onClick={() => setFilter(s.id)} style={{
                padding: '10px 14px',
                border: filter === s.id ? `2px solid ${s.color}` : '1px solid #DDD',
                background: filter === s.id ? s.color + '10' : '#fff',
                color: s.color, borderRadius: 8, fontSize: 14,
                fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap'
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
