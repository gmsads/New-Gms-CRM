import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import leadApi from '../../../services/lead.api';
import RuleBuilder from '../components/RuleBuilder';
import { Megaphone, Plus, Users, Target, ShieldCheck, X, Settings2 } from 'lucide-react';

/**
 * CampaignManagement.jsx
 * Tele Sales Campaign List & Creation UI
 */
export default function CampaignManagement() {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [activeCampaignForRules, setActiveCampaignForRules] = useState(null);

  // Form
  const [form, setForm] = useState({
    name: '', description: '', campaignType: 'Outbound', pipeline: 'Tele Sales',
    campaignManager: '', managers: [], agents: [], priority: 'Medium', expectedLeads: 100,
    distributionMethod: 'On Demand', batchSize: 10
  });
  const [mgrSearch, setMgrSearch] = useState('');
  const [execSearch, setExecSearch] = useState('');

  const fetchCampaigns = () => {
    if (!user) return;
    setLoading(true);
    leadApi.listCampaigns(user.token)
      .then(res => {
        if (res.success) setCampaigns(res.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCampaigns();
    if (user) {
      fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/employees`, {
        headers: { Authorization: `Bearer ${user.token}` }
      })
        .then(r => r.json())
        .then(res => setUsers(res.data || res.employees || []))
        .catch(console.error);
    }
  }, [user]);

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.name.trim()) {
      alert('Please enter a Campaign Name');
      return;
    }
    const primaryMgr = (form.managers && form.managers[0]) || form.campaignManager || user._id;
    leadApi.createCampaign({ 
      ...form, 
      campaignManager: primaryMgr,
      managers: (form.managers && form.managers.length > 0) ? form.managers : [primaryMgr]
    }, user.token)
      .then(res => {
        if (res.success) {
          setShowCreateModal(false);
          fetchCampaigns();
          if (form.distributionMethod === 'Rule Based Distribution' || form.distributionMethod === 'Conditional') {
            setActiveCampaignForRules(res.data);
            setShowRuleModal(true);
          }
        }
      })
      .catch(err => alert(err.message || 'Failed to create campaign'));
  };

  const toggleAgent = (id) => {
    setForm(prev => ({
      ...prev,
      agents: prev.agents.includes(id) ? prev.agents.filter(x => x !== id) : [...prev.agents, id]
    }));
  };

  const toggleManager = (id) => {
    setForm(prev => ({
      ...prev,
      managers: (prev.managers || []).includes(id) ? (prev.managers || []).filter(x => x !== id) : [...(prev.managers || []), id]
    }));
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tele Sales Campaign Management</h1>
          <p className="text-xs text-muted-foreground">Orchestrate calling pipelines, batch distribution quotas, and dynamic AST rules.</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-primary text-primary-foreground font-bold rounded-xl shadow hover:bg-primary/90 text-xs flex items-center gap-1.5"
        >
          <Plus className="h-4 w-4" /> Create Campaign
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-3 p-8 text-center text-muted-foreground animate-pulse">Loading Campaigns...</div>
        ) : campaigns.length === 0 ? (
          <div className="col-span-3 p-12 bg-card border rounded-2xl text-center text-muted-foreground">
            No telecalling campaigns active. Click Create Campaign to launch.
          </div>
        ) : (
          campaigns.map(camp => (
            <div key={camp._id} className="bg-card border rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between relative overflow-hidden">
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded border bg-primary/10 text-primary font-bold">
                    {camp.pipeline || 'Tele Sales'}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded font-bold bg-muted">
                    {camp.status}
                  </span>
                </div>
                <h3 className="font-bold text-lg leading-tight text-foreground">{camp.name}</h3>
                <p className="text-xs text-muted-foreground line-clamp-2">{camp.description || 'No description provided.'}</p>
              </div>

              <div className="pt-3 border-t space-y-2 text-xs text-muted-foreground font-mono">
                <div className="flex justify-between"><span>Strategy:</span> <strong className="text-foreground">{camp.distributionMethod}</strong></div>
                {camp.distributionMethod === 'On Demand' && (
                  <div className="flex justify-between"><span>Batch Quota:</span> <strong className="text-primary">{camp.batchSize} leads/press</strong></div>
                )}
                <div className="flex justify-between"><span>Assigned Agents:</span> <strong className="text-foreground">{camp.agents?.length || 0} execs</strong></div>
              </div>

              {camp.distributionMethod === 'Rule Based Distribution' && (
                <button
                  onClick={() => { setActiveCampaignForRules(camp); setShowRuleModal(true); }}
                  className="w-full py-2 bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground font-bold rounded-xl transition-all text-xs flex items-center justify-center gap-1.5"
                >
                  <Settings2 className="h-3.5 w-3.5" /> Set Routing Rules
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Create Tele Sales Campaign Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-lg text-foreground">Create Tele Sales Campaign</h3>
              <button type="button" onClick={() => setShowCreateModal(false)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>
            
            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-foreground block mb-1">Campaign Name *</label>
                  <input required type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full border rounded p-2 bg-background text-foreground outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="font-bold text-foreground block mb-1">Target Pipeline</label>
                  <select value={form.pipeline} onChange={e => setForm({...form, pipeline: e.target.value})} className="w-full border rounded p-2 bg-background font-bold text-primary outline-none focus:border-primary">
                    <option value="Tele Sales">Tele Sales</option>
                    <option value="Sales">Sales</option>
                    <option value="Appointment">Appointment</option>
                    <option value="Quotation">Quotation</option>
                    <option value="Order">Order</option>
                    <option value="Advertising">Advertising</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-foreground block mb-1">Description</label>
                <textarea rows={2} value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full border rounded p-2 bg-background text-foreground outline-none focus:border-primary" />
              </div>

              {/* Replacing Type/Priority/Expected Quota with Two Searchable Select Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* Field 1: Who will be managing this campaign? */}
                <div className="space-y-1">
                  <label className="font-bold text-foreground block">Who will be managing this campaign?</label>
                  <div className="border rounded-xl p-2.5 bg-background space-y-2">
                    <input 
                      type="text" 
                      placeholder="Filter search managers..." 
                      value={mgrSearch} 
                      onChange={e => setMgrSearch(e.target.value)} 
                      className="w-full border rounded p-1.5 text-xs bg-card text-foreground outline-none focus:border-primary"
                    />
                    <div className="flex flex-wrap gap-1">
                      {(form.managers || []).map(mid => {
                        const u = users.find(x => x._id === mid);
                        return u ? (
                          <span key={mid} className="bg-primary/10 text-primary px-2 py-0.5 rounded text-[11px] font-semibold flex items-center gap-1">
                            {u.name}
                            <button type="button" onClick={() => toggleManager(mid)} className="hover:text-red-600 font-bold">×</button>
                          </span>
                        ) : null;
                      })}
                    </div>
                    <div className="max-h-28 overflow-y-auto grid grid-cols-1 gap-1 border-t pt-1">
                      {(() => {
                        const mgrList = users.filter(u => ['SALES_MANAGER', 'SR_SALES_MANAGER', 'BRANCH_HEAD', 'ADMIN', 'MD_CEO'].includes(u.role) || u.role?.toLowerCase().includes('manager'));
                        const displayMgrs = mgrList.length > 0 ? mgrList : users;
                        return displayMgrs
                          .filter(u => u.name?.toLowerCase().includes(mgrSearch.toLowerCase()) || u.role?.toLowerCase().includes(mgrSearch.toLowerCase()))
                          .map(u => (
                            <label key={u._id} className="flex items-center gap-2 p-1 rounded hover:bg-muted cursor-pointer text-[11px]">
                              <input type="checkbox" checked={(form.managers || []).includes(u._id)} onChange={() => toggleManager(u._id)} className="rounded text-primary" />
                              <span className="truncate font-medium text-foreground">{u.name} <span className="text-[10px] text-muted-foreground">({u.role})</span></span>
                            </label>
                          ));
                      })()}
                    </div>
                  </div>
                </div>

                {/* Field 2: Assign Calling Executives */}
                <div className="space-y-1">
                  <label className="font-bold text-foreground block">Assign Calling Executives</label>
                  <div className="border rounded-xl p-2.5 bg-background space-y-2">
                    <input 
                      type="text" 
                      placeholder="Filter search executives..." 
                      value={execSearch} 
                      onChange={e => setExecSearch(e.target.value)} 
                      className="w-full border rounded p-1.5 text-xs bg-card text-foreground outline-none focus:border-primary"
                    />
                    <div className="flex flex-wrap gap-1">
                      {form.agents.map(aid => {
                        const u = users.find(x => x._id === aid);
                        return u ? (
                          <span key={aid} className="bg-primary/10 text-primary px-2 py-0.5 rounded text-[11px] font-semibold flex items-center gap-1">
                            {u.name}
                            <button type="button" onClick={() => toggleAgent(aid)} className="hover:text-red-600 font-bold">×</button>
                          </span>
                        ) : null;
                      })}
                    </div>
                    <div className="max-h-28 overflow-y-auto grid grid-cols-1 gap-1 border-t pt-1">
                      {(() => {
                        const execList = users.filter(u => ['SALES_EXEC', 'SR_SALES_EXEC', 'FIELD_EXEC', 'AGENT'].includes(u.role) || u.role?.toLowerCase().includes('exec') || u.role?.toLowerCase().includes('agent'));
                        const displayExecs = execList.length > 0 ? execList : users;
                        return displayExecs
                          .filter(u => u.name?.toLowerCase().includes(execSearch.toLowerCase()) || u.role?.toLowerCase().includes(execSearch.toLowerCase()))
                          .map(u => (
                            <label key={u._id} className="flex items-center gap-2 p-1 rounded hover:bg-muted cursor-pointer text-[11px]">
                              <input type="checkbox" checked={form.agents.includes(u._id)} onChange={() => toggleAgent(u._id)} className="rounded text-primary" />
                              <span className="truncate font-medium text-foreground">{u.name} <span className="text-[10px] text-muted-foreground">({u.role})</span></span>
                            </label>
                          ));
                      })()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Lead Distribution Strategy */}
              <div className="bg-muted/30 p-4 rounded-xl border space-y-3 mt-2">
                <label className="font-bold uppercase block text-primary tracking-wider text-xs">Lead Distribution Strategy</label>
                <div className="grid grid-cols-3 gap-2">
                  {['On Demand', 'Equal Distribution', 'Rule Based Distribution'].map(dm => (
                    <button type="button" key={dm} onClick={() => setForm({...form, distributionMethod: dm})} className={`p-2.5 rounded-lg border cursor-pointer text-center font-bold transition-all text-xs ${form.distributionMethod === dm ? 'bg-primary text-primary-foreground shadow' : 'bg-background hover:bg-muted text-foreground'}`}>
                      {dm}
                    </button>
                  ))}
                </div>
                {form.distributionMethod === 'On Demand' && (
                  <div className="flex items-center gap-2 pt-1 text-xs"><span className="font-bold">Batch Size per Press:</span><input type="number" value={form.batchSize} onChange={e => setForm({...form, batchSize: parseInt(e.target.value)||10})} className="w-20 border rounded p-1 bg-background font-mono font-bold text-center" /><span>leads</span></div>
                )}
              </div>

              {/* Footer Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-5 py-2 border rounded-xl font-semibold hover:bg-muted text-xs">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-primary text-primary-foreground font-bold rounded-xl shadow hover:bg-primary/90 text-xs">Launch Campaign</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AST Rule Builder Modal */}
      {showRuleModal && activeCampaignForRules && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border rounded-2xl max-w-3xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-lg">Routing Conditions for: {activeCampaignForRules.name}</h3>
              <button onClick={() => setShowRuleModal(false)}><X className="h-5 w-5" /></button>
            </div>
            <RuleBuilder
              users={users}
              onSaveRules={(rules) => {
                leadApi.saveRules(activeCampaignForRules._id, rules, user.token)
                  .then(res => {
                    if (res.success) {
                      alert('AST Routing Rules Saved successfully.');
                      setShowRuleModal(false);
                    }
                  })
                  .catch(err => alert('Failed to save rules: ' + (err.message || 'Error')));
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
