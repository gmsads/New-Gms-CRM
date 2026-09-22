import React, { useState, useEffect } from 'react';
import { 
  MessageCircle, Camera, Megaphone, FileSpreadsheet, 
  LayoutTemplate, Store, Sparkles, ShoppingBag, 
  Clock, Calendar, CreditCard, Briefcase, MessageSquare,
  Link2, Settings, FileText, Search, PhoneCall, X, Copy
} from 'lucide-react';
import api from '../../../../services/api';
import { useAuth } from '../../../../context/AuthContext';

const providerConfig = {
  FACEBOOK_LEAD_ADS: { icon: LayoutTemplate, iconColor: 'text-blue-600', iconBg: 'bg-blue-50' },
  FACEBOOK_COMMENTS: { icon: MessageCircle, iconColor: 'text-blue-600', iconBg: 'bg-blue-50' },
  CLICK_TO_WHATSAPP_ADS: { icon: MessageSquare, iconColor: 'text-green-500', iconBg: 'bg-green-50' },
  WHATSAPP: { icon: MessageCircle, iconColor: 'text-green-500', iconBg: 'bg-green-50' },
  INDIAMART_LEADS: { icon: Store, iconColor: 'text-red-500', iconBg: 'bg-red-50' },
  JUSTDIAL: { icon: PhoneCall, iconColor: 'text-orange-500', iconBg: 'bg-orange-50' },
  SULEKHA: { icon: Store, iconColor: 'text-red-600', iconBg: 'bg-red-50' },
  TRADEINDIA: { icon: Store, iconColor: 'text-yellow-600', iconBg: 'bg-yellow-50' },
  RAZORPAY: { icon: CreditCard, iconColor: 'text-blue-700', iconBg: 'bg-blue-50' },
  GOOGLE_SHEETS: { icon: FileSpreadsheet, iconColor: 'text-green-600', iconBg: 'bg-green-50' },
  GOOGLE_ADS: { icon: Megaphone, iconColor: 'text-blue-600', iconBg: 'bg-blue-50' },
  GOOGLE_CALENDAR: { icon: Calendar, iconColor: 'text-blue-600', iconBg: 'bg-blue-50' },
  GOOGLE_BUSINESS: { icon: Store, iconColor: 'text-blue-600', iconBg: 'bg-blue-50' },
};

const Integrations = () => {
  const { user } = useAuth();
  const [integrations, setIntegrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedProvider, setSelectedProvider] = useState(null);
  const [configFormData, setConfigFormData] = useState({ 
    apiKey: '', 
    webhookUrl: '',
    whatsappPhoneNumberId: '',
    whatsappAccessToken: '',
    whatsappAppSecret: ''
  });

  const fetchIntegrations = async () => {
    try {
      const res = await api.get('/integrations', user?.token);
      if (res.success && res.data && res.data.length > 0) {
        setIntegrations(res.data);
      } else {
        throw new Error('Empty data');
      }
    } catch (err) {
      console.error('Failed to fetch integrations, using fallback data', err);
      // Fallback data if backend is down or MongoDB SSL error occurs
      const fallbackData = Object.keys(providerConfig).map(key => ({
        provider: key,
        title: key.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
        desc: 'Connect ' + key.replace(/_/g, ' ').toLowerCase(),
        status: 'NOT_CONNECTED',
        isActive: false
      }));
      setIntegrations(fallbackData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const handleToggle = async (provider, currentState) => {
    // Optimistic update
    setIntegrations(prev => prev.map(i => i.provider === provider ? { ...i, isActive: !currentState } : i));
    try {
      await api.post('/integrations/toggle', { provider, isActive: !currentState }, user?.token);
    } catch (err) {
      console.error('Failed to toggle integration', err);
    }
  };

  const handleConnectClick = (provider) => {
    setSelectedProvider(provider);
    setConfigFormData({ 
      apiKey: '', 
      webhookUrl: '',
      whatsappPhoneNumberId: '',
      whatsappAccessToken: '',
      whatsappAppSecret: ''
    });
  };

  const handleSaveConfig = async () => {
    if (!selectedProvider) return;
    
    // Optimistic update so UI works even if DB is down
    setIntegrations(prev => prev.map(i => i.provider === selectedProvider ? { ...i, status: 'CONNECTED', isActive: true } : i));
    setSelectedProvider(null);

    try {
      await api.post('/integrations/connect', { provider: selectedProvider, ...configFormData }, user?.token);
    } catch (err) {
      console.error('Failed to connect integration', err);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading Integrations...</div>;
  }

  const filteredIntegrations = integrations.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8 max-w-[1600px] mx-auto animate-in fade-in duration-700 h-[calc(100vh-4rem)] flex flex-col overflow-y-auto bg-slate-50">
      
      {/* Header section matching the image layout structure */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 shrink-0 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Connect your stack</h1>
          <p className="text-slate-500 text-sm mt-1">Plug ChatHub into the tools your team already uses.</p>
        </div>
        <div className="relative w-full md:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
            placeholder="Search integrations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoComplete="off"
          />
        </div>
      </div>

      {/* Grid of integrations */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-12">
        {filteredIntegrations.map((item) => {
          const config = providerConfig[item.provider] || { icon: Settings, iconColor: 'text-slate-600', iconBg: 'bg-slate-50' };
          const Icon = config.icon;
          
          return (
            <div key={item.provider} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[220px] transition-all hover:shadow-md">
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-3">
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${config.iconBg}`}>
                    <Icon className={`h-5 w-5 ${config.iconColor}`} />
                  </div>
                  
                  {/* Status Indicator Top Right */}
                  {item.status === 'CONNECTED' ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-600">Active</span>
                      <button 
                        onClick={() => handleToggle(item.provider, item.isActive)}
                        className={`w-10 h-5 rounded-full relative transition-colors ${item.isActive ? 'bg-blue-600' : 'bg-slate-200'}`}
                      >
                        <div className={`absolute top-0.5 bottom-0.5 w-4 bg-white rounded-full transition-transform ${item.isActive ? 'right-0.5 translate-x-0' : 'left-0.5 translate-x-0'}`} />
                      </button>
                    </div>
                  ) : item.status === 'NEEDS_CONFIGURATION' ? (
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded-md">
                      <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                      Configure
                    </div>
                  ) : (
                    <div className="text-xs font-semibold text-slate-400 bg-slate-50 border px-2 py-1 rounded-md">
                      Not connected
                    </div>
                  )}
                </div>
                
                <h3 className="font-bold text-slate-900 text-[15px] mb-1">{item.title}</h3>
                <p className="text-slate-500 text-[13px] leading-relaxed line-clamp-2">{item.desc}</p>
              </div>

              {/* Action Buttons Footer */}
              <div className="p-3 border-t bg-slate-50 flex gap-3">
                {item.status === 'CONNECTED' || item.status === 'NEEDS_CONFIGURATION' ? (
                  <>
                    {item.status === 'CONNECTED' && (
                      <button className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors">
                        <FileText className="h-3.5 w-3.5" />
                        Logs
                      </button>
                    )}
                    <button className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-semibold rounded-lg hover:bg-emerald-100 transition-colors">
                      <Settings className="h-3.5 w-3.5" />
                      Manage
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={() => handleConnectClick(item.provider)}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <Link2 className="h-3.5 w-3.5" />
                    Connect
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Configuration Modal */}
      {selectedProvider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200 p-4">
          <div className={`bg-white rounded-xl shadow-xl w-full ${selectedProvider === 'WHATSAPP' ? 'max-w-3xl' : 'max-w-md'} max-h-full overflow-hidden flex flex-col animate-in zoom-in-95 duration-200`}>
            <div className="flex justify-between items-center p-5 border-b shrink-0">
              <h3 className="font-bold text-slate-900">
                Connect {providerConfig[selectedProvider]?.title || selectedProvider}
              </h3>
              <button onClick={() => setSelectedProvider(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            
            <div className="overflow-y-auto flex-1">
              {(() => {
                const isOauth = ['FACEBOOK_COMMENTS', 'FACEBOOK_LEAD_ADS', 'CLICK_TO_WHATSAPP_ADS', 'GOOGLE_SHEETS', 'GOOGLE_CALENDAR', 'GOOGLE_ADS', 'GOOGLE_BUSINESS'].includes(selectedProvider);
                const isWebhook = ['JUSTDIAL', 'SULEKHA', 'TRADEINDIA', 'INDIAMART_LEADS'].includes(selectedProvider);

                if (selectedProvider === 'WHATSAPP') {
                  return (
                    <div className="p-6 space-y-8">
                      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                        <h4 className="text-blue-800 font-bold mb-2 flex items-center gap-2">
                          <MessageCircle className="h-5 w-5" /> 
                          Official Meta WhatsApp Cloud API Setup Guide
                        </h4>
                        <p className="text-blue-700 text-sm">
                          <strong>Important:</strong> You do NOT buy any third-party software (like Wati, Interakt, or WappBlaster). You register directly with Meta (Facebook) for the Official Meta WhatsApp Cloud API.
                          Registration is FREE, the first 1,000 Service Chats every month are FREE, and marketing messages cost approx ₹0.70 – ₹0.78 per conversation directly to your Facebook Credit/Debit Card. Zero monthly subscription fees.
                        </p>
                      </div>

                      <div className="space-y-6 text-sm text-slate-700">
                        <section>
                          <h5 className="font-bold text-slate-900 text-base mb-2">Step 1: Create a Meta Developer Account</h5>
                          <ol className="list-decimal pl-5 space-y-1">
                            <li>Open <a href="https://developers.facebook.com" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">developers.facebook.com</a> in your browser.</li>
                            <li>Log in using your primary Facebook account.</li>
                            <li>Click <strong>Get Started</strong> in the top right corner to accept Developer Terms.</li>
                          </ol>
                        </section>

                        <section>
                          <h5 className="font-bold text-slate-900 text-base mb-2">Step 2: Create a Meta Business App for WhatsApp</h5>
                          <ol className="list-decimal pl-5 space-y-1">
                            <li>Click <strong>My Apps</strong> &rarr; <strong>Create App</strong>.</li>
                            <li>Select App Type: <strong>Business</strong> &rarr; Click <strong>Next</strong>.</li>
                            <li>App Display Name: Type <code className="bg-slate-100 px-1 rounded text-pink-600">GMS-CRM</code>.</li>
                            <li>App Contact Email: Enter your admin email.</li>
                            <li>Business Account: Select your Meta Business Account (or let Meta auto-create one for you).</li>
                            <li>Click <strong>Create App</strong>.</li>
                            <li>On the <strong>Add Products</strong> dashboard, scroll to <strong>WhatsApp</strong> and click <strong>Set up</strong>.</li>
                          </ol>
                        </section>

                        <section>
                          <h5 className="font-bold text-slate-900 text-base mb-2">Step 3: Add & Verify Your WhatsApp Phone Number</h5>
                          <ol className="list-decimal pl-5 space-y-1">
                            <li>In the left menu, go to <strong>WhatsApp</strong> &rarr; <strong>API Setup</strong>.</li>
                            <li>Scroll to <strong>Step 5: Add a phone number</strong> and click <strong>Add phone number</strong>.</li>
                            <li>Fill in your business info (Display Name: <code className="bg-slate-100 px-1 rounded text-pink-600">GMS-CRM</code>, Category: Software & Technology).</li>
                            <li>Enter your phone number.
                               <div className="bg-amber-50 text-amber-800 p-2 mt-1 rounded border border-amber-200">
                                 <strong>Warning:</strong> The phone number must NOT be actively linked to a personal WhatsApp app on any phone. If it is, delete the account from that phone first.
                               </div>
                            </li>
                            <li>Select verification option and enter the OTP code.</li>
                          </ol>
                        </section>

                        <section>
                          <h5 className="font-bold text-slate-900 text-base mb-2">Step 4: Generate Permanent System User Access Token</h5>
                          <ol className="list-decimal pl-5 space-y-1">
                            <li>Go to <a href="https://business.facebook.com/settings" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">business.facebook.com/settings</a>.</li>
                            <li>Under <strong>Users</strong>, click <strong>System Users</strong> &rarr; Click <strong>Add</strong>.</li>
                            <li>System User Name: <code className="bg-slate-100 px-1 rounded text-pink-600">ERP_WhatsApp_Admin</code> &rarr; Role: <strong>Admin</strong>.</li>
                            <li>Click <strong>Add Assets</strong>, select the app and WhatsApp account, and enable Full Control. Save Changes.</li>
                            <li>Click <strong>Generate New Token</strong>: Select App, set Expiration to <strong>Never</strong>, and check <code className="bg-slate-100 px-1 rounded">whatsapp_business_messaging</code> and <code className="bg-slate-100 px-1 rounded">whatsapp_business_management</code>.</li>
                            <li>Generate and copy the long access token string.</li>
                          </ol>
                        </section>
                        
                        <section>
                          <h5 className="font-bold text-slate-900 text-base mb-2">Step 5: Add Payment Method & Message Templates</h5>
                          <p className="mb-2">Add your card in Meta Billing, then create your Message Templates in the WhatsApp dashboard.</p>
                        </section>

                        <div className="border-t border-slate-200 pt-6 mt-6">
                          <h5 className="font-bold text-slate-900 text-lg mb-4">Step 6: Enter Credentials into GMS-CRM</h5>
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">WhatsApp Phone Number ID</label>
                              <input
                                type="text"
                                value={configFormData.whatsappPhoneNumberId}
                                onChange={(e) => setConfigFormData({ ...configFormData, whatsappPhoneNumberId: e.target.value })}
                                placeholder="e.g. 123456789012345"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">Permanent Access Token</label>
                              <input
                                type="password"
                                value={configFormData.whatsappAccessToken}
                                onChange={(e) => setConfigFormData({ ...configFormData, whatsappAccessToken: e.target.value })}
                                placeholder="EAAG..."
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">App Secret</label>
                              <input
                                type="password"
                                value={configFormData.whatsappAppSecret}
                                onChange={(e) => setConfigFormData({ ...configFormData, whatsappAppSecret: e.target.value })}
                                placeholder="Found under App Settings > Basic"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }

                if (isOauth) {
                  return (
                    <div className="p-5 space-y-4">
                      <div className="text-sm text-slate-600 mb-4">
                        Authorize ChatHub to access your {selectedProvider.includes('GOOGLE') ? 'Google' : 'Meta'} account to enable this integration.
                      </div>
                      <button className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                        <Link2 className="h-4 w-4" />
                        Authenticate with {selectedProvider.includes('GOOGLE') ? 'Google' : 'Meta'}
                      </button>
                    </div>
                  );
                }
                
                if (isWebhook) {
                  return (
                    <div className="p-5 space-y-4">
                      <div className="p-3 bg-blue-50 text-blue-700 text-sm rounded-lg border border-blue-100 mb-2">
                        <strong>{providerConfig[selectedProvider]?.title}</strong> pushes leads via Webhooks. Copy the URL below and paste it in your provider dashboard.
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Your Webhook URL</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            readOnly
                            value={`https://api.chathub.com/webhooks/${selectedProvider.toLowerCase()}`}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-600 text-sm focus:outline-none"
                          />
                          <button className="p-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 bg-white shadow-sm transition-colors">
                            <Copy className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                }

                // Default API Key Form
                return (
                  <div className="p-5 space-y-4">
                    <div className="p-3 bg-blue-50 text-blue-700 text-sm rounded-lg border border-blue-100 mb-4">
                      Setting up <strong>{providerConfig[selectedProvider]?.title}</strong> requires an API key from your dashboard.
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">API Key / Secret Token</label>
                      <input
                        type="password"
                        value={configFormData.apiKey}
                        onChange={(e) => setConfigFormData({ ...configFormData, apiKey: e.target.value })}
                        placeholder="Enter API Key"
                        autoComplete="new-password"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                );
              })()}
            </div>
            
            <div className="p-4 border-t bg-slate-50 flex justify-end gap-3 shrink-0">
              <button 
                type="button"
                onClick={() => setSelectedProvider(null)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={handleSaveConfig}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Save & Connect
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Integrations;
