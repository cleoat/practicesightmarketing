import { useState, useEffect } from 'react';
import MetricsBar from './components/MetricsBar';
import PipelineView from './components/PipelineView';
import SettingsPanel from './components/SettingsPanel';
import {
  getLeads, setLeads, addLead, updateLead, deleteLead,
  getSettings, setSettings, updateSetting,
  getRedditStats, resetDailyStats, getBackendUrl, setBackendUrl
} from './lib/storage';
import { COLORS, DEFAULT_LEAD, SPAM_KEYWORDS, STAGES } from './lib/constants';
import { validateInput, leadSchema } from './lib/validators';

function App() {
  const [leads, setLeadsState] = useState([]);
  const [settings, setSettingsState] = useState({});
  const [redditStats, setRedditStatsState] = useState({});
  const [backendUrl, setBackendUrlState] = useState('');
  const [input, setInput] = useState('');
  const [msg, setMsg] = useState('');
  const [filter, setFilter] = useState('all');
  const [loaded, setLoaded] = useState(false);

  // Load data on mount
  useEffect(() => {
    setLeadsState(getLeads());
    setSettingsState(getSettings());
    resetDailyStats();
    setRedditStatsState(getRedditStats());
    setBackendUrlState(getBackendUrl());
    setLoaded(true);
  }, []);

  // Save leads
  useEffect(() => {
    if (loaded) setLeads(leads);
  }, [leads, loaded]);

  // Save settings
  useEffect(() => {
    if (loaded) setSettings(settings);
  }, [settings, loaded]);

  // Auto-detect stage from keywords
  function detectStage(comment) {
    const lower = comment.toLowerCase();
    if (lower.includes('unbilled') || lower.includes('stuck') || lower.includes('aging') || lower.includes('billing')) return 'warm';
    if (lower.includes('how') || lower.includes('try')) return 'hot';
    if (lower.includes('tested') || lower.includes('used')) return 'testing';
    if (lower.includes('found') || lower.includes('worked')) return 'feedback';
    if (lower.includes('headway') || lower.includes('alma')) return 'not_fit';
    if (lower.includes('?')) return 'engaged';
    return 'saw_it';
  }

  // Add lead
  function handleAddLead() {
    const lines = input.trim().split('\n');
    const name = lines[0]?.trim();
    const comment = lines.slice(1).join(' ').trim();

    if (!name || !comment) {
      setMsg('❌ Need: Name (line 1) + comment (line 2+)');
      setTimeout(() => setMsg(''), 2000);
      return;
    }

    // Validate
    const clean = { ...DEFAULT_LEAD, name, comment };
    const validation = validateInput(leadSchema, clean);
    if (!validation.valid) {
      setMsg(`❌ ${validation.error}`);
      setTimeout(() => setMsg(''), 2000);
      return;
    }

    // Check spam locally first
    if (SPAM_KEYWORDS.some(k => comment.toLowerCase().includes(k))) {
      setMsg('⚠️ Spam keyword detected');
      setTimeout(() => setMsg(''), 2000);
      return;
    }

    const stage = detectStage(comment);
    const newLead = { ...DEFAULT_LEAD, name, comment, stage, id: Date.now() };
    
    setLeadsState([newLead, ...leads]);
    setInput('');
    setMsg('✓ Added');
    setTimeout(() => setMsg(''), 1500);
  }

  // Update lead
  function handleUpdateLead(id, updates) {
    setLeadsState(leads.map(l => l.id === id ? { ...l, ...updates } : l));
  }

  // Delete lead
  function handleDeleteLead(id) {
    setLeadsState(leads.filter(l => l.id !== id));
  }

  // Handle reply
  function handleReply(id, comment) {
    if (!comment.trim()) return;
    const lead = leads.find(l => l.id === id);
    if (!lead) return;

    // Add to comment history
    const newComments = (lead.reply ? lead.reply + '\n---\n' : '') + comment;
    handleUpdateLead(id, { reply: comment });
    setMsg('✓ Reply added');
    setTimeout(() => setMsg(''), 1500);
  }

  // Update setting
  function handleUpdateSetting(key, value) {
    setSettingsState({ ...settings, [key]: value });
  }

  // Update backend URL
  function handleBackendUrlChange(url) {
    setBackendUrlState(url);
    setBackendUrl(url);
  }

  if (!loaded) {
    return (
      <div style={{
        fontFamily: "'DM Sans', system-ui, sans-serif",
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: COLORS.bg,
        color: COLORS.muted
      }}>
        Loading...
      </div>
    );
  }

  return (
    <div style={{
      fontFamily: "'DM Sans', system-ui, sans-serif",
      color: COLORS.text,
      background: COLORS.bg,
      minHeight: '100vh',
      padding: '16px'
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.5px', marginBottom: 4 }}>
            PracticeSight Outreach
          </div>
          <div style={{ fontSize: 11, color: COLORS.muted, fontFamily: 'monospace' }}>
            + Reddit Automation (Free tier LLMs only, $0 cost)
          </div>
        </div>

        {/* Metrics */}
        <MetricsBar leads={leads} redditStats={redditStats} />

        {/* Quick add */}
        <div style={{
          background: '#fff',
          border: `1px solid ${COLORS.border}`,
          borderRadius: 12,
          padding: 16,
          marginBottom: 20
        }}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.ctrlKey && e.key === 'Enter' && handleAddLead()}
            placeholder="Paste: Name (line 1) + their comment (line 2+). Ctrl+Enter to add."
            rows={3}
            style={{
              width: '100%',
              padding: 12,
              fontSize: 13,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 9,
              fontFamily: 'inherit',
              lineHeight: 1.5,
              marginBottom: 10,
              boxSizing: 'border-box',
              resize: 'vertical'
            }}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleAddLead}
              style={{
                flex: 1,
                fontSize: 14,
                fontWeight: 600,
                padding: 12,
                background: COLORS.primary,
                color: '#fff',
                border: 'none',
                borderRadius: 9,
                cursor: 'pointer',
                fontFamily: 'inherit'
              }}
            >
              + Add lead (auto-detects stage)
            </button>
            <SettingsPanel
              settings={settings}
              onUpdate={handleUpdateSetting}
              backendUrl={backendUrl}
              onBackendUrlChange={handleBackendUrlChange}
            />
          </div>
          {msg && (
            <div style={{
              fontSize: 12,
              marginTop: 10,
              padding: '8px 12px',
              borderRadius: 8,
              background: msg.includes('❌') ? '#FFE5E5' : msg.includes('⚠️') ? '#FFFBF0' : '#E5F5EB',
              color: msg.includes('❌') ? '#C44' : msg.includes('⚠️') ? '#854F0B' : '#166534',
              textAlign: 'center',
              fontWeight: 600
            }}>
              {msg}
            </div>
          )}
        </div>

        {/* Stage filters */}
        <div style={{
          display: 'flex',
          gap: 8,
          marginBottom: 20,
          overflowX: 'auto',
          paddingBottom: 8
        }}>
          <button
            onClick={() => setFilter('all')}
            style={{
              padding: '8px 16px',
              border: filter === 'all' ? '2px solid #111' : '1px solid #DDD',
              background: filter === 'all' ? '#111' : '#fff',
              color: filter === 'all' ? '#fff' : '#555',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            All ({leads.length})
          </button>
          {STAGES.map(s => {
            const count = leads.filter(l => l.stage === s.id).length;
            return (
              <button
                key={s.id}
                onClick={() => setFilter(s.id)}
                style={{
                  padding: '8px 14px',
                  border: filter === s.id ? `2px solid ${s.color}` : '1px solid #DDD',
                  background: filter === s.id ? s.color + '10' : '#fff',
                  color: s.color,
                  borderRadius: 20,
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
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
          filter={filter}
        />
      </div>
    </div>
  );
}

export default App;
