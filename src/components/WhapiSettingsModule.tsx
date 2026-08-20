import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Send, 
  Key, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  ExternalLink, 
  BellRing, 
  Save, 
  ShieldCheck, 
  Eye, 
  EyeOff,
  Trash2,
  HelpCircle,
  Smartphone,
  AlertTriangle
} from 'lucide-react';

export interface WhapiLog {
  id: string;
  timestamp: string;
  to: string;
  message: string;
  status: 'Sent' | 'Failed';
  statusCode?: number;
  responseMsg?: string;
}

export interface WhapiConfigState {
  token: string;
  apiUrl: string;
  recipient: string;
  autoNotifyTableTalk: boolean;
  autoNotifyJobs: boolean;
  autoNotifyEvents: boolean;
  autoNotifyMemberJoin: boolean;
  autoNotifyOtp: boolean;
}

export interface WhapiLog {
  id: string;
  timestamp: string;
  to: string;
  message: string;
  status: 'Sent' | 'Failed';
  statusCode?: number;
  responseMsg?: string;
}

export const WhapiSettingsModule: React.FC = () => {
  const [config, setConfig] = useState<WhapiConfigState>({
    token: '',
    apiUrl: 'https://gate.whapi.cloud/messages/text',
    recipient: '120363419135488102@g.us',
    autoNotifyTableTalk: true,
    autoNotifyJobs: true,
    autoNotifyEvents: true,
    autoNotifyMemberJoin: true,
    autoNotifyOtp: true
  });

  const [hasToken, setHasToken] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Test message state
  const [testRecipient, setTestRecipient] = useState('');
  const [testMessage, setTestMessage] = useState('Hello! This is a test notification from BUTEX PGD Alumni Portal via Whapi.cloud WhatsApp API.');
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; details?: any } | null>(null);

  // Groups state
  const [fetchedGroups, setFetchedGroups] = useState<{ id: string; name: string }[]>([]);
  const [fetchingGroups, setFetchingGroups] = useState(false);
  const [groupsError, setGroupsError] = useState<string | null>(null);

  // Logs state
  const [logs, setLogs] = useState<WhapiLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  const handleFetchGroups = () => {
    setFetchingGroups(true);
    setGroupsError(null);
    fetch('/api/whapi/fetch-groups')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.groups)) {
          setFetchedGroups(data.groups);
          if (data.groups.length === 0) {
            setGroupsError("No WhatsApp groups found for this channel. Make sure your Whapi phone number is a member in your target group!");
          }
        } else {
          setGroupsError(data.error || "Failed to fetch groups from Whapi");
        }
      })
      .catch(err => setGroupsError(err.message || "Failed to fetch groups"))
      .finally(() => setFetchingGroups(false));
  };

  const fetchConfig = () => {
    setLoading(true);
    fetch('/api/whapi/config')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.config) {
          const loadedRecipient = data.config.recipient || '';
          const finalRecipient = (!loadedRecipient || loadedRecipient.includes('chat.whatsapp.com')) 
            ? '120363419135488102@g.us' 
            : loadedRecipient;
            
          setConfig({ ...data.config, recipient: finalRecipient });
          setHasToken(data.hasToken || Boolean(data.config.token));
          setTestRecipient(finalRecipient);
        }
      })
      .catch(err => console.error('Error loading Whapi config:', err))
      .finally(() => setLoading(false));
  };

  const fetchLogs = () => {
    setLogsLoading(true);
    fetch('/api/whapi/logs')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setLogs(data.logs || []);
        }
      })
      .catch(err => console.error('Error fetching Whapi logs:', err))
      .finally(() => setLogsLoading(false));
  };

  useEffect(() => {
    fetchConfig();
    fetchLogs();
    handleFetchGroups();
  }, []);

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Normalize API Gateway URL if user entered only domain
    let cleanApiUrl = (config.apiUrl || '').trim();
    if (cleanApiUrl.endsWith('/')) cleanApiUrl = cleanApiUrl.slice(0, -1);
    if (cleanApiUrl === 'https://gate.whapi.cloud' || !cleanApiUrl.includes('/messages/')) {
      cleanApiUrl = 'https://gate.whapi.cloud/messages/text';
    }

    const updatedConfig = { ...config, apiUrl: cleanApiUrl };
    setConfig(updatedConfig);

    setLoading(true);
    fetch('/api/whapi/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedConfig)
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setSaveStatus('✓ Whapi.cloud WhatsApp configuration saved successfully!');
          setHasToken(Boolean(config.token));
          setTimeout(() => setSaveStatus(null), 4000);
        } else {
          setSaveStatus(`❌ Error saving config: ${data.message || 'Unknown error'}`);
        }
      })
      .catch(err => setSaveStatus(`❌ Network error: ${err.message}`))
      .finally(() => setLoading(false));
  };

  const handleSendTestMessage = (e: React.FormEvent) => {
    e.preventDefault();
    setTestLoading(true);
    setTestResult(null);

    fetch('/api/whapi/send-test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: testRecipient || config.recipient,
        message: testMessage
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setTestResult({
            success: true,
            message: data.message || 'WhatsApp message sent successfully via Whapi.cloud!',
            details: data.result
          });
        } else {
          setTestResult({
            success: false,
            message: data.message || 'Dispatch failed via Whapi.cloud.',
            details: data.result
          });
        }
        fetchLogs();
      })
      .catch(err => {
        setTestResult({
          success: false,
          message: `Network Exception: ${err.message}`
        });
      })
      .finally(() => setTestLoading(false));
  };

  const handleClearLogs = () => {
    if (!window.confirm('Clear all Whapi WhatsApp dispatch logs?')) return;
    fetch('/api/whapi/logs', { method: 'DELETE' })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          fetchLogs();
        }
      });
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-emerald-800/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center space-x-2 bg-emerald-500/20 text-emerald-300 text-xs font-bold px-3 py-1 rounded-full border border-emerald-500/30">
            <Smartphone className="w-3.5 h-3.5" />
            <span>Whapi.cloud WhatsApp Gateway</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            WhatsApp Notification Configuration
          </h2>
          <p className="text-emerald-100/80 text-xs sm:text-sm leading-relaxed">
            Configure your Whapi channel credentials from <a href="https://panel.whapi.cloud/" target="_blank" rel="noopener noreferrer" className="underline font-bold hover:text-emerald-300">panel.whapi.cloud</a> to enable automated WhatsApp notifications for TableTalk posts, job postings, reunions, and member security OTPs.
          </p>
        </div>

        <a
          href="https://panel.whapi.cloud/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center space-x-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs px-5 py-3 rounded-2xl shadow-lg transition-all hover:scale-105 shrink-0"
        >
          <span>Open Whapi Panel</span>
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      {saveStatus && (
        <div className={`p-4 rounded-2xl text-xs font-bold border flex items-center justify-between ${
          saveStatus.includes('✓') 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          <span>{saveStatus}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Config Form (2 cols) */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Whapi Channel Credentials</h3>
                  <p className="text-xs text-slate-500">Provided by panel.whapi.cloud dashboard</p>
                </div>
              </div>
              
              <div className={`px-3 py-1 rounded-full text-[11px] font-extrabold flex items-center space-x-1 ${
                hasToken ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {hasToken ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                <span>{hasToken ? 'Channel Ready' : 'Token Needed'}</span>
              </div>
            </div>

            <form onSubmit={handleSaveConfig} className="space-y-6">
              {/* Token Input */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>Whapi API Token</span>
                  <a href="https://panel.whapi.cloud/" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline text-[11px]">
                    Get Token from Panel &rarr;
                  </a>
                </label>
                <div className="relative">
                  <input
                    type={showToken ? 'text' : 'password'}
                    value={config.token}
                    onChange={(e) => setConfig({ ...config, token: e.target.value })}
                    placeholder="Enter your Whapi API token (e.g. Bo6M44SDyJYZ2loUyZ...)"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 pr-12 text-xs font-mono focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  >
                    {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400">
                  Channel token generated inside panel.whapi.cloud &gt; Channels &gt; Settings.
                </p>
              </div>

              {/* API Gateway URL */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700">Whapi Gateway Endpoint</label>
                  <input
                    type="text"
                    value={config.apiUrl}
                    onChange={(e) => setConfig({ ...config, apiUrl: e.target.value })}
                    onBlur={() => {
                      let cleanUrl = (config.apiUrl || '').trim();
                      if (cleanUrl.endsWith('/')) cleanUrl = cleanUrl.slice(0, -1);
                      if (cleanUrl === 'https://gate.whapi.cloud' || (!cleanUrl.includes('/messages/') && cleanUrl.length > 0)) {
                        cleanUrl = 'https://gate.whapi.cloud/messages/text';
                      }
                      setConfig({ ...config, apiUrl: cleanUrl });
                    }}
                    placeholder="https://gate.whapi.cloud/messages/text"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-xs font-mono focus:outline-none focus:border-emerald-500"
                  />
                  <p className="text-[11px] text-emerald-600 font-medium">Auto-formats to: https://gate.whapi.cloud/messages/text</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">Default Recipient (Group JID / Phone / Link)</label>
                    <button
                      type="button"
                      onClick={handleFetchGroups}
                      disabled={fetchingGroups}
                      className="text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-lg transition-colors flex items-center space-x-1"
                    >
                      {fetchingGroups ? (
                        <>
                          <RefreshCw className="w-3 h-3 animate-spin text-emerald-600" />
                          <span>Fetching Groups...</span>
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-3 h-3 text-emerald-600" />
                          <span>Auto-Fetch My Groups</span>
                        </>
                      )}
                    </button>
                  </div>

                  {fetchedGroups.length > 0 && (
                    <div className="p-3 bg-emerald-50/90 border border-emerald-300 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-emerald-950 block">Select Target WhatsApp Group for Notifications:</label>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                          Auto-Fetched ({fetchedGroups.length} Groups)
                        </span>
                      </div>
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            setConfig({ ...config, recipient: e.target.value });
                            setTestRecipient(e.target.value);
                          }
                        }}
                        value={config.recipient}
                        className="w-full bg-white border border-emerald-400 rounded-lg px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 shadow-sm"
                      >
                        <option value="">-- Choose Group Below --</option>
                        {fetchedGroups.map(g => (
                          <option key={g.id} value={g.id}>
                            {g.name} ({g.id})
                          </option>
                        ))}
                      </select>
                      
                      {config.recipient === '120363419135488102@g.us' ? (
                        <p className="text-[10px] font-semibold text-emerald-800 flex items-center space-x-1">
                          <span>✅ Default Group Active: <strong>BUTEX PGD-TIM ALUMNI</strong> (<code className="font-mono text-emerald-950 font-bold">120363419135488102@g.us</code>). Change group anytime using the dropdown.</span>
                        </p>
                      ) : (
                        <p className="text-[10px] font-semibold text-emerald-800">
                          ✓ Group selected! Click "Save Whapi Configuration" below to lock in this default group.
                        </p>
                      )}
                    </div>
                  )}

                  {groupsError && (
                    <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-[11px] text-rose-800 font-medium">
                      ⚠️ {groupsError}
                    </div>
                  )}

                  <input
                    type="text"
                    value={config.recipient}
                    onChange={(e) => setConfig({ ...config, recipient: e.target.value })}
                    placeholder="e.g. 120363423719406224@g.us or https://chat.whatsapp.com/KweNkLIs5KCFMDM3W3Aza6"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-xs font-mono focus:outline-none focus:border-emerald-500"
                  />

                  {config.recipient.includes('chat.whatsapp.com') && (
                    <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-[11px] text-amber-900 space-y-1">
                      <div className="flex items-center space-x-1.5 font-bold text-amber-950">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>WhatsApp Group Invite Link Detected</span>
                      </div>
                      <p className="text-amber-800">
                        Whapi API requires the official <strong>Group Chat JID</strong> ending in <code className="bg-white/80 px-1 py-0.5 rounded text-amber-950 font-bold font-mono">@g.us</code> (e.g. <code className="bg-white/80 px-1 py-0.5 rounded text-amber-950 font-bold font-mono">1203630XXXXXXXXX@g.us</code>) to deliver messages inside the WhatsApp Group. Click <strong>"Auto-Fetch My Groups"</strong> above to select it directly!
                      </p>
                    </div>
                  )}
                  <p className="text-[11px] text-slate-400">Enter WhatsApp Group Chat JID ending in @g.us or click Auto-Fetch My Groups.</p>
                </div>
              </div>

              {/* Guide on How to find WHAPI_DEFAULT_RECIPIENT */}
              <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200/80 text-xs text-slate-700 space-y-2.5">
                <div className="flex items-center space-x-2 font-extrabold text-emerald-900">
                  <HelpCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>How to Get Your WhatsApp Group Chat JID (@g.us) in 3 Quick Steps:</span>
                </div>
                <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-slate-700 pl-1 font-medium">
                  <li>
                    <strong className="text-slate-900">Step 1:</strong> Make sure your connected Whapi phone number (<code className="bg-emerald-100 px-1 py-0.5 rounded text-emerald-900 font-mono">+880 1826 666641</code>) is added as a member in your WhatsApp Group (<code className="bg-emerald-100 px-1 py-0.5 rounded text-emerald-900 font-mono">BUTEX PGD Alumni</code>).
                  </li>
                  <li>
                    <strong className="text-slate-900">Step 2:</strong> Open your Whapi Dashboard at <a href="https://panel.whapi.cloud/" target="_blank" rel="noopener noreferrer" className="text-emerald-700 underline font-extrabold hover:text-emerald-900">panel.whapi.cloud</a> &gt; click <strong>Chats</strong> in the side menu.
                  </li>
                  <li>
                    <strong className="text-slate-900">Step 3:</strong> Select your WhatsApp Group chat and copy its <strong>Chat ID / JID</strong> ending in <code className="bg-emerald-100 px-1.5 py-0.5 rounded text-emerald-900 font-extrabold font-mono">@g.us</code> (e.g., <code className="bg-emerald-100 px-1.5 py-0.5 rounded text-emerald-900 font-extrabold font-mono">1203630XXXXXXXXX@g.us</code>).
                  </li>
                </ol>
                <div className="pt-1.5 border-t border-emerald-200/60 text-[11px] text-slate-600">
                  💡 <em>Pasting the exact <code className="font-mono bg-emerald-100/80 px-1 rounded text-emerald-900 font-bold">@g.us</code> JID guarantees 100% direct instant delivery into your WhatsApp Group!</em>
                </div>
              </div>

              {/* Automated Triggers */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                  Automated Notification Dispatch Triggers
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="flex items-center space-x-3 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:bg-emerald-50/50 transition-colors">
                    <input
                      type="checkbox"
                      checked={config.autoNotifyTableTalk}
                      onChange={(e) => setConfig({ ...config, autoNotifyTableTalk: e.target.checked })}
                      className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-slate-800 block">TableTalk Discussions</span>
                      <span className="text-[11px] text-slate-500">Notify group on new discussion posts</span>
                    </div>
                  </label>

                  <label className="flex items-center space-x-3 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:bg-emerald-50/50 transition-colors">
                    <input
                      type="checkbox"
                      checked={config.autoNotifyJobs}
                      onChange={(e) => setConfig({ ...config, autoNotifyJobs: e.target.checked })}
                      className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-slate-800 block">Job Circulars</span>
                      <span className="text-[11px] text-slate-500">Alert on new approved job postings</span>
                    </div>
                  </label>

                  <label className="flex items-center space-x-3 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:bg-emerald-50/50 transition-colors">
                    <input
                      type="checkbox"
                      checked={config.autoNotifyEvents}
                      onChange={(e) => setConfig({ ...config, autoNotifyEvents: e.target.checked })}
                      className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-slate-800 block">Events & Reunions</span>
                      <span className="text-[11px] text-slate-500">Alert group on new published events</span>
                    </div>
                  </label>

                  <label className="flex items-center space-x-3 p-3 bg-emerald-50/60 rounded-xl border border-emerald-200 cursor-pointer hover:bg-emerald-100/60 transition-colors">
                    <input
                      type="checkbox"
                      checked={config.autoNotifyMemberJoin}
                      onChange={(e) => setConfig({ ...config, autoNotifyMemberJoin: e.target.checked })}
                      className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-emerald-950 block">🎉 New Member Google Sheet Join</span>
                      <span className="text-[11px] text-emerald-800 font-medium">Alert WhatsApp group when new alumni join Google Sheet</span>
                    </div>
                  </label>

                  <label className="flex items-center space-x-3 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:bg-emerald-50/50 transition-colors">
                    <input
                      type="checkbox"
                      checked={config.autoNotifyOtp}
                      onChange={(e) => setConfig({ ...config, autoNotifyOtp: e.target.checked })}
                      className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-slate-800 block">Security OTP Codes</span>
                      <span className="text-[11px] text-slate-500">Send login verification OTPs to member numbers</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Google Sheet Member Join Webhook Script Instructions */}
              <div className="p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-emerald-400 flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Google Sheet Member Join WhatsApp Webhook Code</span>
                  </span>
                  <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-mono px-2 py-0.5 rounded font-bold border border-emerald-500/30">
                    Apps Script Trigger
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Paste this 1-minute snippet into your Google Sheet's <strong>Extensions &gt; Apps Script</strong> to send an automatic WhatsApp alert via Whapi whenever a new member submits your Google Form or joins the sheet:
                </p>
                <pre className="text-[10px] font-mono bg-slate-950 text-emerald-300 p-3 rounded-xl overflow-x-auto border border-slate-800 leading-relaxed">
{`function onFormSubmit(e) {
  var values = e.values; // Row values from Google Form submission
  var payload = {
    name: values[1] || "New Alumni Member",
    email: values[2] || "",
    phone: values[3] || "",
    rollNo: values[4] || "PGD Batch Member",
    company: values[5] || "",
    designation: values[6] || ""
  };
  
  var options = {
    'method': 'post',
    'contentType': 'application/json',
    'payload': JSON.stringify(payload)
  };
  
  // Call your BUTEX Portal Member Join Webhook Endpoint
  UrlFetchApp.fetch('${window.location.origin}/api/alumni/member-join', options);
}`}
                </pre>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{loading ? 'Saving Credentials...' : 'Save Whapi Configuration'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Live Test Tool */}
        <div className="space-y-8">
          <div className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 shadow-xl space-y-5">
            <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">Live Whapi Dispatch Test</h3>
                <p className="text-xs text-slate-400">Send instant WhatsApp message</p>
              </div>
            </div>

            <form onSubmit={handleSendTestMessage} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Target Recipient Number or Group ID</label>
                <input
                  type="text"
                  value={testRecipient}
                  onChange={(e) => setTestRecipient(e.target.value)}
                  placeholder="8801700000000"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300">Test Message Content</label>
                  <span className="text-[10px] text-slate-400">Quick Presets:</span>
                </div>
                <div className="flex flex-wrap gap-1.5 pb-1">
                  <button
                    type="button"
                    onClick={() => setTestMessage("*WhatsApp Notification to PGD Group:*\n🎉 *New Member Joined BUTEX PGD Alumni Portal!*\n👤 *Name:* Engr. Tanvir Ahmed\n🎓 *Roll / Batch:* PGD-2024 / Batch 02\n🏢 *Company:* AJS Apparel Group (Assistant Manager - Quality)\n📱 *Phone:* +8801700000000")}
                    className="text-[10px] bg-emerald-950 text-emerald-300 hover:bg-emerald-900 border border-emerald-700/60 px-2 py-1 rounded-md font-bold transition-all"
                  >
                    + Member Join Alert
                  </button>
                  <button
                    type="button"
                    onClick={() => setTestMessage("*WhatsApp Notification to PGD Group:*\nDr. Kamruzzaman requested to join on table talk on USTER Statistics.")}
                    className="text-[10px] bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700 px-2 py-1 rounded-md transition-all"
                  >
                    + TableTalk Preset
                  </button>
                  <button
                    type="button"
                    onClick={() => setTestMessage("*WhatsApp Notification to PGD Group:*\nNew Job Circular: Quality Assurance Manager at Beximco Textiles.")}
                    className="text-[10px] bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700 px-2 py-1 rounded-md transition-all"
                  >
                    + Job Preset
                  </button>
                </div>
                <textarea
                  rows={4}
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={testLoading}
                className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs shadow-lg transition-all flex items-center justify-center space-x-2"
              >
                <BellRing className="w-4 h-4" />
                <span>{testLoading ? 'Dispatching via Whapi...' : 'Send WhatsApp Test Message'}</span>
              </button>
            </form>

            {testResult && (
              <div className={`p-4 rounded-xl text-xs space-y-2 border ${
                testResult.success ? 'bg-emerald-950/60 border-emerald-700/60 text-emerald-200' : 'bg-rose-950/60 border-rose-700/60 text-rose-200'
              }`}>
                <div className="font-bold flex items-center space-x-2">
                  {testResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-rose-400" />}
                  <span>{testResult.message}</span>
                </div>
                {testResult.details && (
                  <pre className="text-[10px] font-mono bg-slate-950/80 p-2.5 rounded-lg overflow-x-auto text-slate-300 max-h-40">
                    {JSON.stringify(testResult.details, null, 2)}
                  </pre>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Logs Section */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center font-bold">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Whapi.cloud Dispatch Logs</h3>
              <p className="text-xs text-slate-500">History of outbound WhatsApp notification requests</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={fetchLogs}
              disabled={logsLoading}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors flex items-center space-x-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${logsLoading ? 'animate-spin' : ''}`} />
              <span>Refresh Logs</span>
            </button>

            {logs.length > 0 && (
              <button
                onClick={handleClearLogs}
                className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors flex items-center space-x-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            )}
          </div>
        </div>

        {logs.length === 0 ? (
          <div className="py-12 text-center text-slate-400 space-y-2">
            <Smartphone className="w-8 h-8 mx-auto opacity-50" />
            <p className="text-xs font-medium">No WhatsApp dispatch logs recorded yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Time</th>
                  <th className="py-3 px-4">Recipient</th>
                  <th className="py-3 px-4">Message Content</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4">Response Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] font-bold text-slate-800">
                      {log.to}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 max-w-md">
                      <p className="line-clamp-2">{log.message}</p>
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                        log.status === 'Sent' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {log.status === 'Sent' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        <span>{log.status}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-[11px] text-slate-500 font-mono">
                      {log.responseMsg || 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
