import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { ProjectState, UserRole, Priority } from '../types';
import { TrendingUp, Activity, AlertCircle, Wallet, Sparkles, Flag, Zap, Check, Trash2, Clock, ArrowRight, AlertTriangle, Calendar, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { api } from '../services/api';
import ReactMarkdown from 'react-markdown';

const Dashboard: React.FC = () => {
  const { currentRole, projectId } = useOutletContext<{ currentRole: UserRole; projectId: string }>();
  const [data, setData] = useState<ProjectState | null>(null);
  const [insight, setInsight] = useState<string | null>(null);
  const [loadingInsight, setLoadingInsight] = useState(false);

  useEffect(() => {
    const loadProject = async () => {
      const projectData = await api.getProject(projectId);
      setData(projectData);
    };
    loadProject();
  }, [projectId]);

  const handleGenerateInsights = async () => {
    setLoadingInsight(true);
    // In real backend you would call /projects/:id/insights
    // For now simulate
    setInsight("AI Analysis: Project is 68% on track. Critical pending high-priority items detected. Recommend accelerating BOQ item 'Bridge Foundation' by allocating 15 more laborers.");
    setLoadingInsight(false);
  };

  if (!data) return <div className="p-10 text-center">Loading Dashboard...</div>;

  const totalPlannedValue = data.boq.reduce((sum, item) => sum + (item.plannedQty * item.rate), 0);
  const totalExecutedValue = data.boq.reduce((sum, item) => sum + (item.executedQty * item.rate), 0);
  const progressPercentage = Math.round((totalExecutedValue / totalPlannedValue) * 100) || 0;

  const chartData = [
    { name: 'Planned', amount: totalPlannedValue },
    { name: 'Executed', amount: totalExecutedValue },
  ];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Project Dashboard</h1>
          <p className="text-slate-500">Role: <span className="font-semibold text-blue-600">{currentRole}</span></p>
        </div>
        <button 
          onClick={handleGenerateInsights}
          disabled={loadingInsight}
          className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-6 py-3 rounded-2xl hover:shadow-lg disabled:opacity-70"
        >
          <Sparkles className="w-5 h-5" />
          {loadingInsight ? 'Analyzing...' : 'Ask AI Analyst'}
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200">
          <div className="flex justify-between">
            <div>
              <p className="text-sm text-slate-500">Progress</p>
              <h3 className="text-4xl font-bold mt-2">{progressPercentage}%</h3>
            </div>
            <Activity className="w-10 h-10 text-blue-600" />
          </div>
        </div>
        {/* Add other KPI cards similarly */}
      </div>

      {/* Gantt & Pending Work - keep your original ProjectGantt component logic here */}

      {insight && (
        <div className="bg-white border border-indigo-100 rounded-3xl p-8">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Sparkles className="text-indigo-500" /> AI Insight Report
          </h3>
          <ReactMarkdown className="prose">{insight}</ReactMarkdown>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
