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
  AlertTriangle,
  QrCode
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

  // Channel health & real WhatsApp connection status
  const [channelStatus, setChannelStatus] = useState<{
    hasToken: boolean;
    status: string;
    statusCode?: number;
    channelId?: string | null;
    user?: { id?: string; name?: string } | null;
    isReady: boolean;
    message?: string;
    loading: boolean;
  }>({
    hasToken: false,
    status: 'CHECKING',
    isReady: false,
    loading: true
  });

  const [qrImage, setQrImage] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [showQrCard, setShowQrCard] = useState(false);

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

  const fetchChannelStatus = (tokenOverride?: string) => {
    const tokenToUse = (tokenOverride !== undefined ? tokenOverride : config.token || '').trim();
    if (!tokenToUse) {
      setChannelStatus({
        hasToken: false,
        status: 'NO_TOKEN',
        isReady: false,
        loading: false,
        message: 'Whapi Token Required'
      });
      return;
    }
    setChannelStatus(prev => ({ ...prev, loading: true }));
    fetch(`/api/whapi/status?token=${encodeURIComponent(tokenToUse)}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setChannelStatus({
            hasToken: data.hasToken,
            status: data.status,
            statusCode: data.statusCode,
            channelId: data.channelId,
            user: data.user,
            isReady: Boolean(data.isReady),
            message: data.message,
            loading: false
          });
          if (data.status === 'QR' && !data.isReady) {
            setShowQrCard(true);
            fetchQrCode(tokenToUse);
          }
        } else {
          setChannelStatus(prev => ({ ...prev, loading: false }));
        }
      })
      .catch(() => setChannelStatus(prev => ({ ...prev, loading: false })));
  };

  const fetchQrCode = (tokenOverride?: string) => {
    const tokenToUse = (tokenOverride !== undefined ? tokenOverride : config.token || '').trim();
    if (!tokenToUse) return;
    setQrLoading(true);
    fetch(`/api/whapi/qr?token=${encodeURIComponent(tokenToUse)}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.qr) {
          setQrImage(data.qr);
        }
      })
      .catch(err => console.error('Error fetching QR:', err))
      .finally(() => setQrLoading(false));
  };

  const handleFetchGroups = (tokenOverride?: string) => {
    setFetchingGroups(true);
    setGroupsError(null);
    const tokenToUse = (tokenOverride !== undefined ? tokenOverride : config.token || '').trim();
    const inviteToUse = (config.recipient || '').trim();
    fetch(`/api/whapi/fetch-groups?token=${encodeURIComponent(tokenToUse)}&invite=${encodeURIComponent(inviteToUse)}`)
      .then(async res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (data.channelStatus === 'QR' || data.isReady === false) {
          setGroupsError("⚠️ Your Whapi channel is waiting for WhatsApp QR authorization. Please scan the QR Code above to link your WhatsApp phone, then click Auto-Fetch My Groups.");
          setShowQrCard(true);
          fetchQrCode(tokenToUse);
        } else if (data.success && Array.isArray(data.groups)) {
          setFetchedGroups(data.groups);
          if (data.groups.length === 0) {
            setGroupsError("No WhatsApp groups found for this channel. Make sure your Whapi phone number has joined your target WhatsApp group!");
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
      .then(async res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (data.success && data.config) {
          const loadedRecipient = data.config.recipient || '120363419135488102@g.us';
          setConfig({ ...data.config, recipient: loadedRecipient });
          setHasToken(data.hasToken || Boolean(data.config.token));
          setTestRecipient(loadedRecipient);
          if (data.config.token) {
            fetchChannelStatus(data.config.token);
            handleFetchGroups(data.config.token);
          }
        }
      })
      .catch(err => console.error('Error loading Whapi config:', err))
      .finally(() => setLoading(false));
  };

  const fetchLogs = () => {
    setLogsLoading(true);
    fetch('/api/whapi/logs')
      .then(async res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
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
          fetchChannelStatus(updatedConfig.token);
          handleFetchGroups(updatedConfig.token);
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Whapi Channel Credentials</h3>
                  <p className="text-xs text-slate-500">Live WhatsApp Gateway status from panel.whapi.cloud</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {channelStatus.loading ? (
                  <div className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-slate-100 text-slate-600 flex items-center space-x-1.5 border border-slate-200">
                    <RefreshCw className="w-3 h-3 animate-spin text-slate-500" />
                    <span>Checking Status...</span>
                  </div>
                ) : !hasToken && !config.token ? (
                  <div className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-amber-100 text-amber-800 flex items-center space-x-1.5 border border-amber-200">
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Token Needed</span>
                  </div>
                ) : channelStatus.isReady ? (
                  <div className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-800 flex items-center space-x-1.5 border border-emerald-300 shadow-sm">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>WhatsApp Connected {channelStatus.user?.id ? `(+${channelStatus.user.id})` : ''}</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setShowQrCard(true);
                      fetchQrCode();
                    }}
                    className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-amber-100 hover:bg-amber-200 text-amber-900 flex items-center space-x-1.5 border border-amber-300 transition-all cursor-pointer shadow-sm animate-pulse"
                  >
                    <QrCode className="w-3.5 h-3.5 text-amber-700" />
                    <span>Scan QR Code Required</span>
                  </button>
                )}
              </div>
            </div>

            {/* LIVE WHATSAPP QR CODE SCANNING CARD */}
            {(showQrCard || (!channelStatus.isReady && (config.token || hasToken))) && (
              <div className="p-5 bg-gradient-to-br from-amber-50 via-orange-50/40 to-emerald-50/30 rounded-2xl border-2 border-amber-300 shadow-md space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-sm">
                      <QrCode className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-amber-950">Link WhatsApp Phone to Whapi Channel</h4>
                      <p className="text-[11px] text-amber-800">
                        Channel: <span className="font-mono font-bold text-amber-950">{channelStatus.channelId || 'SPDRMN-DZWZF'}</span> &bull; Status: <span className="font-bold text-amber-700 uppercase">{channelStatus.status || 'QR Mode'}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => fetchQrCode()}
                      disabled={qrLoading}
                      className="px-3 py-1.5 rounded-xl bg-white border border-amber-300 hover:bg-amber-100 text-amber-900 text-xs font-bold transition-all flex items-center space-x-1.5 shadow-sm"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${qrLoading ? 'animate-spin' : ''}`} />
                      <span>Refresh QR</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        fetchChannelStatus();
                        handleFetchGroups();
                      }}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center space-x-1.5 shadow-sm cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Check Connection</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-center bg-white p-4 rounded-xl border border-amber-200">
                  <div className="flex flex-col items-center justify-center p-3 bg-slate-50 rounded-xl border border-slate-200 shrink-0">
                    {qrLoading ? (
                      <div className="w-44 h-44 flex flex-col items-center justify-center space-y-2 text-slate-400">
                        <RefreshCw className="w-7 h-7 animate-spin text-amber-600" />
                        <span className="text-[11px] font-bold text-slate-600">Generating QR...</span>
                      </div>
                    ) : qrImage ? (
                      <img src={qrImage} alt="WhatsApp QR Code" className="w-44 h-44 object-contain rounded-lg border border-slate-100 shadow-sm" />
                    ) : (
                      <div className="w-44 h-44 flex flex-col items-center justify-center space-y-2 text-slate-400 text-center p-3">
                        <QrCode className="w-8 h-8 text-slate-300" />
                        <span className="text-[11px] font-medium text-slate-500">Click "Refresh QR" to generate login QR</span>
                      </div>
                    )}
                    <span className="text-[10px] text-slate-500 mt-2 font-mono font-medium">QR expires in 20 seconds</span>
                  </div>

                  <div className="md:col-span-2 space-y-3 text-xs text-slate-700">
                    <div className="font-extrabold text-slate-900 flex items-center space-x-2 text-sm">
                      <Smartphone className="w-4 h-4 text-emerald-600" />
                      <span>How to link in 3 steps:</span>
                    </div>
                    <ol className="list-decimal list-inside space-y-2 text-[12px] text-slate-700 pl-1 font-medium leading-relaxed">
                      <li>
                        Open <strong>WhatsApp</strong> on your mobile phone (the number that is in your Alumni Group).
                      </li>
                      <li>
                        Tap <strong>Settings</strong> (iPhone) or <strong>⋮ Menu</strong> (Android) &gt; <strong>Linked Devices</strong>.
                      </li>
                      <li>
                        Tap <strong>Link a Device</strong> and point your phone camera at this QR code.
                      </li>
                    </ol>
                    <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-[11px] text-emerald-900 font-semibold flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Once scanned, WhatsApp will link instantly and allow sending alerts to your Alumni Group!</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSaveConfig} className="space-y-6">
              {/* Token Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">Whapi API Token</label>
                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowQrCard(!showQrCard);
                        if (!showQrCard) fetchQrCode();
                      }}
                      className="text-amber-700 hover:text-amber-800 text-[11px] font-bold flex items-center space-x-1"
                    >
                      <QrCode className="w-3.5 h-3.5 text-amber-600" />
                      <span>{showQrCard ? 'Hide QR Code' : 'Scan WhatsApp QR Code'}</span>
                    </button>
                    <a href="https://panel.whapi.cloud/" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline text-[11px]">
                      Whapi Panel &rarr;
                    </a>
                  </div>
                </div>
                <div className="relative">
                  <input
                    type={showToken ? 'text' : 'password'}
                    value={config.token}
                    onChange={(e) => setConfig({ ...config, token: e.target.value })}
                    placeholder="Enter your Whapi API token (e.g. fjfG2CDah9p61pKATGi6AlV0DGXtTQGE)"
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
                  Channel token from panel.whapi.cloud &gt; Channels &gt; Settings.
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
                  <p className="text-[11px] text-emerald-600 font-medium">Standard endpoint: https://gate.whapi.cloud/messages/text</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">Default Recipient (Group JID / Phone)</label>
                    <button
                      type="button"
                      onClick={() => handleFetchGroups()}
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
                          <span>✅ Default Group Active: <strong>BUTEX PGD-TIM ALUMNI</strong> (<code className="font-mono text-emerald-950 font-bold">120363419135488102@g.us</code>).</span>
                        </p>
                      ) : (
                        <p className="text-[10px] font-semibold text-emerald-800">
                          ✓ Group selected! Click "Save Whapi Configuration" below to lock in this default group.
                        </p>
                      )}
                    </div>
                  )}

                  {groupsError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-[11px] text-rose-800 font-medium space-y-2">
                      <div>{groupsError}</div>
                      {groupsError.includes('QR') && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowQrCard(true);
                            fetchQrCode();
                          }}
                          className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs flex items-center space-x-1"
                        >
                          <QrCode className="w-3 h-3" />
                          <span>Show QR Code to Link Phone</span>
                        </button>
                      )}
                    </div>
                  )}

                  <input
                    type="text"
                    value={config.recipient}
                    onChange={(e) => setConfig({ ...config, recipient: e.target.value })}
                    placeholder="e.g. 120363419135488102@g.us"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-xs font-mono focus:outline-none focus:border-emerald-500"
                  />

                  {/* 1-Click Group JID Conversion if Invite Link Entered */}
                  {config.recipient.includes('chat.whatsapp.com') && (
                    <div className="p-3.5 bg-amber-50 border-2 border-amber-300 rounded-xl text-xs text-amber-900 space-y-2 shadow-sm">
                      <div className="flex items-center space-x-1.5 font-bold text-amber-950">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>WhatsApp Group Invite Link Detected</span>
                      </div>
                      <p className="text-amber-800 text-[11px] leading-relaxed">
                        WhatsApp invite links cannot receive automated API messages directly. Whapi requires the official <strong>Group Chat JID</strong> ending in <code className="bg-white px-1.5 py-0.5 rounded font-bold font-mono text-amber-950 border border-amber-300">@g.us</code>.
                      </p>
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setConfig({ ...config, recipient: '120363419135488102@g.us' });
                            setTestRecipient('120363419135488102@g.us');
                          }}
                          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-sm flex items-center space-x-1.5 transition-all cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Set Official Group JID (120363419135488102@g.us)</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Quick Presets */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="text-[11px] font-bold text-slate-500">Quick Presets:</span>
                    <button
                      type="button"
                      onClick={() => {
                        setConfig({ ...config, recipient: '120363419135488102@g.us' });
                        setTestRecipient('120363419135488102@g.us');
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all border ${
                        config.recipient === '120363419135488102@g.us'
                          ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                      }`}
                    >
                      👥 BUTEX Alumni Group (120363419135488102@g.us)
                    </button>
                    {channelStatus.user?.id && (
                      <button
                        type="button"
                        onClick={() => {
                          const phone = channelStatus.user?.id?.replace(/\D/g, '') || '';
                          setConfig({ ...config, recipient: phone });
                          setTestRecipient(phone);
                        }}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-all"
                      >
                        📱 My Phone (+{channelStatus.user.id})
                      </button>
                    )}
                  </div>
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
                    <strong className="text-slate-900">Step 1:</strong> Make sure your connected Whapi phone number {channelStatus.user?.id ? (<code className="bg-emerald-100 px-1 py-0.5 rounded text-emerald-900 font-mono">+{channelStatus.user.id}</code>) : '(the number scanned via QR code)'} is added as a member in your WhatsApp Group (<code className="bg-emerald-100 px-1 py-0.5 rounded text-emerald-900 font-mono">BUTEX PGD Alumni</code>).
                  </li>
                  <li>
                    <strong className="text-slate-900">Step 2:</strong> Open your Whapi Dashboard at <a href="https://panel.whapi.cloud/" target="_blank" rel="noopener noreferrer" className="text-emerald-700 underline font-extrabold hover:text-emerald-900">panel.whapi.cloud</a> &gt; click <strong>Chats</strong> in the side menu.
                  </li>
                  <li>
                    <strong className="text-slate-900">Step 3:</strong> Select your WhatsApp Group chat and copy its <strong>Chat ID / JID</strong> ending in <code className="bg-emerald-100 px-1.5 py-0.5 rounded text-emerald-900 font-extrabold font-mono">@g.us</code> (e.g., <code className="bg-emerald-100 px-1.5 py-0.5 rounded text-emerald-900 font-extrabold font-mono">120363419135488102@g.us</code>).
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
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300">Target Recipient Number or Group JID</label>
                  <button
                    type="button"
                    onClick={() => setTestRecipient('120363419135488102@g.us')}
                    className="text-[10px] text-emerald-400 hover:text-emerald-300 font-bold"
                  >
                    Use Alumni Group JID
                  </button>
                </div>
                <input
                  type="text"
                  value={testRecipient}
                  onChange={(e) => setTestRecipient(e.target.value)}
                  placeholder="e.g. 120363419135488102@g.us or 8801826666641"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                />
                {testRecipient.includes('chat.whatsapp.com') && (
                  <button
                    type="button"
                    onClick={() => setTestRecipient('120363419135488102@g.us')}
                    className="w-full py-1.5 px-2.5 bg-amber-500/20 border border-amber-500/40 hover:bg-amber-500/30 text-amber-200 text-[11px] font-bold rounded-lg text-left flex items-center justify-between"
                  >
                    <span>Invite link detected &rarr; Convert to @g.us JID</span>
                    <span className="underline">Convert</span>
                  </button>
                )}
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
