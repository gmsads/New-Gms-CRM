import React, { useState } from 'react';
import { Plus, Trash2, ShieldAlert, Check } from 'lucide-react';

/**
 * RuleBuilder.jsx
 * Enterprise Rule Builder AST UI
 * Supports dynamic AND / OR condition rows and User Routing.
 */
export const RuleBuilder = ({ users = [], onSaveRules }) => {
  const [rules, setRules] = useState([
    {
      name: 'Rule #1: High Priority Routing',
      logic: 'AND',
      conditions: [{ field: 'state', operator: 'EQUALS', value: 'Telangana' }],
      assignToUser: users[0]?._id || ''
    }
  ]);

  const fields = [
    { label: 'State', value: 'state' },
    { label: 'City', value: 'city' },
    { label: 'Business Category', value: 'businessCategory' },
    { label: 'Lead Source', value: 'source' },
    { label: 'Priority', value: 'priority' },
  ];

  const operators = [
    { label: 'Equals', value: 'EQUALS' },
    { label: 'Not Equals', value: 'NOT_EQUALS' },
    { label: 'Contains', value: 'CONTAINS' },
    { label: 'In List (comma separated)', value: 'IN' },
  ];

  const handleAddRule = () => {
    setRules([...rules, {
      name: `Rule #${rules.length + 1}`,
      logic: 'AND',
      conditions: [{ field: 'state', operator: 'EQUALS', value: '' }],
      assignToUser: users[0]?._id || ''
    }]);
  };

  const handleRemoveRule = (idx) => {
    setRules(rules.filter((_, i) => i !== idx));
  };

  const handleAddCondition = (ruleIdx) => {
    const updated = [...rules];
    updated[ruleIdx].conditions.push({ field: 'source', operator: 'EQUALS', value: '' });
    setRules(updated);
  };

  const handleRemoveCondition = (ruleIdx, condIdx) => {
    const updated = [...rules];
    updated[ruleIdx].conditions = updated[ruleIdx].conditions.filter((_, i) => i !== condIdx);
    setRules(updated);
  };

  const handleUpdateCondition = (ruleIdx, condIdx, key, val) => {
    const updated = [...rules];
    updated[ruleIdx].conditions[condIdx][key] = val;
    setRules(updated);
  };

  const handleUpdateRule = (ruleIdx, key, val) => {
    const updated = [...rules];
    updated[ruleIdx][key] = val;
    setRules(updated);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b pb-3">
        <div>
          <h4 className="font-bold text-base">Routing Conditions & Rules</h4>
          <p className="text-xs text-muted-foreground">Leads matching these conditions will be automatically assigned.</p>
        </div>
        <button
          onClick={handleAddRule}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-semibold hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> Add Rule Group
        </button>
      </div>

      {rules.map((rule, rIdx) => (
        <div key={rIdx} className="bg-muted/30 border border-border rounded-xl p-4 space-y-4 relative">
          <div className="flex items-center justify-between">
            <input
              type="text"
              value={rule.name}
              onChange={(e) => handleUpdateRule(rIdx, 'name', e.target.value)}
              className="bg-transparent font-bold text-sm text-foreground border-b border-transparent hover:border-border focus:border-primary focus:outline-none px-1 py-0.5"
            />
            <div className="flex items-center gap-2">
              <select
                value={rule.logic}
                onChange={(e) => handleUpdateRule(rIdx, 'logic', e.target.value)}
                className="bg-background border text-xs font-bold rounded-md px-2 py-1"
              >
                <option value="AND">Match ALL (AND)</option>
                <option value="OR">Match ANY (OR)</option>
              </select>
              <button
                onClick={() => handleRemoveRule(rIdx)}
                className="text-rose-500 p-1 hover:bg-rose-500/10 rounded-md transition-colors"
                title="Delete Rule Group"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Condition Rows */}
          <div className="space-y-2 pl-3 border-l-2 border-primary/40">
            {rule.conditions.map((cond, cIdx) => (
              <div key={cIdx} className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-mono text-muted-foreground w-8">
                  {cIdx === 0 ? 'IF' : rule.logic}
                </span>

                <select
                  value={cond.field}
                  onChange={(e) => handleUpdateCondition(rIdx, cIdx, 'field', e.target.value)}
                  className="bg-background border rounded px-2.5 py-1 text-xs text-foreground min-w-[140px]"
                >
                  {fields.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>

                <select
                  value={cond.operator}
                  onChange={(e) => handleUpdateCondition(rIdx, cIdx, 'operator', e.target.value)}
                  className="bg-background border rounded px-2.5 py-1 text-xs text-foreground"
                >
                  {operators.map(op => <option key={op.value} value={op.value}>{op.label}</option>)}
                </select>

                <input
                  type="text"
                  value={cond.value}
                  onChange={(e) => handleUpdateCondition(rIdx, cIdx, 'value', e.target.value)}
                  placeholder="Value..."
                  className="bg-background border rounded px-3 py-1 text-xs text-foreground flex-1 min-w-[120px]"
                >
                </input>

                {rule.conditions.length > 1 && (
                  <button
                    onClick={() => handleRemoveCondition(rIdx, cIdx)}
                    className="text-muted-foreground hover:text-rose-500 p-1"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}

            <button
              onClick={() => handleAddCondition(rIdx)}
              className="text-[11px] text-primary font-bold flex items-center gap-1 mt-1 hover:underline"
            >
              + Add Condition Row
            </button>
          </div>

          {/* Assignment Routing Target */}
          <div className="flex items-center gap-3 pt-3 border-t bg-background/50 p-3 rounded-lg">
            <span className="text-xs font-semibold text-foreground">THEN ASSIGN TO:</span>
            <select
              value={rule.assignToUser}
              onChange={(e) => handleUpdateRule(rIdx, 'assignToUser', e.target.value)}
              className="bg-background border rounded-md px-3 py-1.5 text-xs font-bold text-primary min-w-[200px]"
            >
              <option value="">-- Select Sales Executive --</option>
              {users.map(u => <option key={u._id} value={u._id}>{u.name} ({u.role})</option>)}
            </select>
          </div>
        </div>
      ))}

      <div className="flex justify-end pt-4">
        <button
          onClick={() => onSaveRules(rules)}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white font-bold rounded-xl shadow hover:bg-emerald-700 transition-all text-sm"
        >
          <Check className="h-4 w-4" /> Save Rule Conditions
        </button>
      </div>
    </div>
  );
};

export default RuleBuilder;
