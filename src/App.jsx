import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, 
  Users, 
  ShoppingBag, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight,
  Filter,
  Download,
  Calendar,
  LayoutDashboard,
  Table as TableIcon,
  Search,
  ChevronDown,
  X,
  Zap,
  Lightbulb,
  AlertTriangle,
  Target,
  Sparkles,
  RefreshCw,
  Key
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie, Legend
} from 'recharts';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Utility for tailwind classes
function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Formatters
const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatNumber = (value) => {
  return new Intl.NumberFormat('en-US').format(value);
};

// --- Components ---

const KPICard = ({ title, value, icon: Icon, trend, trendValue, color }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-4 group hover:shadow-md transition-all">
    <div className="flex justify-between items-start">
      <div className={cn("p-2 rounded-xl bg-opacity-10 transition-transform group-hover:scale-110", color)}>
        <Icon className={cn("w-6 h-6", color.replace('bg-', 'text-'))} />
      </div>
      {trend && (
        <div className={cn(
          "flex items-center text-xs font-medium px-2 py-1 rounded-full",
          trend === 'up' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
        )}>
          {trend === 'up' ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
          {trendValue}
        </div>
      )}
    </div>
    <div>
      <p className="text-slate-500 text-sm font-medium">{title}</p>
      <h3 className="text-2xl font-bold mt-1 text-slate-900">{value}</h3>
    </div>
  </div>
);

const InsightPill = ({ label, value, icon: Icon, color }) => (
  <div className="flex items-center gap-3 bg-white px-4 py-3 rounded-xl border border-slate-100 shadow-sm flex-1 min-w-[200px]">
    <div className={cn("p-2 rounded-lg bg-opacity-10", color)}>
      <Icon className={cn("w-4 h-4", color.replace('bg-', 'text-'))} />
    </div>
    <div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">{label}</p>
      <p className="text-sm font-bold text-slate-900 leading-none">{value}</p>
    </div>
  </div>
);

const FilterBar = ({ filters, setFilters, products, channels }) => (
  <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-8 flex flex-wrap gap-4 items-end">
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-slate-500 uppercase ml-1">Date Range</label>
      <div className="flex items-center gap-2">
        <input 
          type="date" 
          value={filters.startDate}
          onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
        />
        <span className="text-slate-400">to</span>
        <input 
          type="date" 
          value={filters.endDate}
          onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
        />
      </div>
    </div>

    <div className="flex flex-col gap-1.5 flex-1 min-w-[150px]">
      <label className="text-xs font-semibold text-slate-500 uppercase ml-1">Product</label>
      <select 
        value={filters.product}
        onChange={(e) => setFilters(prev => ({ ...prev, product: e.target.value }))}
        className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white"
      >
        <option value="All">All Products</option>
        {products.map(p => <option key={p} value={p}>{p}</option>)}
      </select>
    </div>

    <div className="flex flex-col gap-1.5 flex-1 min-w-[150px]">
      <label className="text-xs font-semibold text-slate-500 uppercase ml-1">Channel</label>
      <select 
        value={filters.channel}
        onChange={(e) => setFilters(prev => ({ ...prev, channel: e.target.value }))}
        className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white"
      >
        <option value="All">All Channels</option>
        {channels.map(c => <option key={c} value={c}>{c}</option>)}
      </select>
    </div>

    <button 
      onClick={() => setFilters({ startDate: '2026-02-24', endDate: '2026-03-08', product: 'All', channel: 'All' })}
      className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 flex items-center gap-2 group transition-colors"
    >
      <X className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
      Reset
    </button>
  </div>
);

const ChartCard = ({ title, children, className }) => (
  <div className={cn("bg-white p-6 rounded-2xl shadow-sm border border-slate-100", className)}>
    <h3 className="text-lg font-bold text-slate-900 mb-6">{title}</h3>
    <div className="h-[300px] w-full">
      {children}
    </div>
  </div>
);

// --- AI Section Components ---

const AIRefinery = ({ dataSummary, metrics }) => {
  const [apiKey, setApiKey] = useState(import.meta.env.VITE_GEMINI_API_KEY || localStorage.getItem('gemini_api_key') || '');
  const [model, setModel] = useState('gemini-1.5-flash');
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState(null);
  const [error, setError] = useState(null);

  const saveApiKey = (key) => {
    setApiKey(key);
    localStorage.setItem('gemini_api_key', key);
  };

  const generateAIInsights = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:3001/api/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metrics, dataSummary, model })
      });
      
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setInsights(data);
    } catch (err) {
      setError(err.message || "AI generation failed.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 mb-8 text-white shadow-2xl overflow-hidden relative group">
      <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none group-hover:opacity-20 transition-opacity">
        <Sparkles className="w-32 h-32" />
      </div>

      <div className="relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <div className="flex items-center gap-2 text-blue-400 font-bold mb-2">
              <Zap className="w-5 h-5 fill-current" />
              <span>AI Insights Engine</span>
            </div>
            <h2 className="text-3xl font-bold">Secure AI Processing</h2>
          </div>

          <div className="flex flex-wrap gap-3 items-center">
            <select 
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              <optgroup label="Gemini 2.5 (Current stable)">
                <option value="gemini-2.5-flash">Gemini 2.5 Flash (Fastest)</option>
                <option value="gemini-2.5-pro">Gemini 2.5 Pro (Most Intelligent)</option>
              </optgroup>
              <optgroup label="Gemini 1.5 (High Compatibility)">
                <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
              </optgroup>
              <optgroup label="Gemini 2.0 (Classic)">
                <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
              </optgroup>
            </select>
            <button 
              onClick={generateAIInsights}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 rounded-lg font-bold transition-all shadow-lg flex items-center gap-2"
            >
               {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
               Run Insights
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl text-rose-300 text-sm mb-6 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5" />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-6 rounded-2xl">
            <div className="flex items-center gap-2 text-rose-400 font-bold mb-3">
              <AlertTriangle className="w-5 h-5" />
              <span>Alert</span>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed italic">
              {insights ? insights.alert : "Enter API key to generate smart alerts based on current trends."}
            </p>
          </div>
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-6 rounded-2xl">
            <div className="flex items-center gap-2 text-emerald-400 font-bold mb-3">
              <Target className="w-5 h-5" />
              <span>Opportunity</span>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed italic">
              {insights ? insights.opportunity : "Discover untapped growth potential hidden in your sales metrics."}
            </p>
          </div>
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-6 rounded-2xl">
            <div className="flex items-center gap-2 text-blue-400 font-bold mb-3">
              <Lightbulb className="w-5 h-5" />
              <span>Suggestion</span>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed italic">
              {insights ? insights.suggestion : "Get AI-driven next steps to optimize your conversion rates."}
            </p>
          </div>
        </div>
        
        {!apiKey && (
            <p className="mt-6 text-xs text-slate-500 text-center">
                Need an API key? Get one at the <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">Google AI Studio</a>.
            </p>
        )}
      </div>
    </div>
  );
};

const Sidebar = () => (
  <aside className="w-64 border-r border-slate-200 bg-white flex-col hidden lg:flex">
    <div className="p-6 border-b border-slate-100">
      <div className="flex items-center gap-2 font-bold text-xl text-blue-600">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
          <TrendingUp className="w-5 h-5" />
        </div>
        <span>Dashflow</span>
      </div>
    </div>
    <nav className="flex-1 p-4 space-y-1">
      <a href="#" className="flex items-center gap-3 px-4 py-2.5 bg-blue-50 text-blue-700 rounded-lg font-medium">
        <LayoutDashboard className="w-5 h-5" />
        Dashboard
      </a>
      <a href="#" className="flex items-center gap-3 px-4 py-2.5 text-slate-600 hover:bg-slate-50 rounded-lg font-medium transition-colors">
        <TableIcon className="w-5 h-5" />
        Analytics
      </a>
    </nav>
  </aside>
);

export default function App() {
  const [rawData, setRawData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    startDate: '2026-02-24',
    endDate: '2026-03-08',
    product: 'All',
    channel: 'All'
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/sales');
        const rows = await response.json();
        setRawData(rows);
        setLoading(false);
      } catch (error) {
        console.error("Error loading sales data:", error);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter Data Logic
  const products = useMemo(() => [...new Set(rawData.map(r => r.product))].sort(), [rawData]);
  const channels = useMemo(() => [...new Set(rawData.map(r => r.channel))].sort(), [rawData]);

  const filteredData = useMemo(() => {
    return rawData.filter(row => {
      const dateMatch = (!filters.startDate || row.date >= filters.startDate) && 
                       (!filters.endDate || row.date <= filters.endDate);
      const productMatch = filters.product === 'All' || row.product === filters.product;
      const channelMatch = filters.channel === 'All' || row.channel === filters.channel;
      return dateMatch && productMatch && channelMatch;
    });
  }, [rawData, filters]);

  // Derived Metrics & Insight Logic
  const metrics = useMemo(() => {
    const revenue = filteredData.reduce((sum, row) => sum + (row.revenue || 0), 0);
    const orders = filteredData.reduce((sum, row) => sum + (row.orders || 0), 0);
    const cost = filteredData.reduce((sum, row) => sum + (row.cost || 0), 0);
    const profit = revenue - cost;
    const aov = orders > 0 ? revenue / orders : 0;
    
    // Core Insights
    const bestProduct = (() => {
      const counts = filteredData.reduce((acc, r) => { acc[r.product] = (acc[r.product] || 0) + r.revenue; return acc; }, {});
      return Object.entries(counts).sort((a,b) => b[1]-a[1])[0]?.[0] || 'N/A';
    })();
    
    const bestChannel = (() => {
      const counts = filteredData.reduce((acc, r) => { acc[r.channel] = (acc[r.channel] || 0) + r.revenue; return acc; }, {});
      return Object.entries(counts).sort((a,b) => b[1]-a[1])[0]?.[0] || 'N/A';
    })();

    const highestRevenueDay = (() => {
      const counts = filteredData.reduce((acc, r) => { acc[r.date] = (acc[r.date] || 0) + r.revenue; return acc; }, {});
      return Object.entries(counts).sort((a,b) => b[1]-a[1])[0]?.[0] || 'N/A';
    })();

    const highCVRChannel = (() => {
        // Mock CVR based on orders/visitors if columns exist
        const stats = filteredData.reduce((acc, r) => {
            if (!acc[r.channel]) acc[r.channel] = { orders: 0, visitors: 0 };
            acc[r.channel].orders += (r.orders || 0);
            acc[r.channel].visitors += (r.visitors || 1);
            return acc;
        }, {});
        return Object.entries(stats).sort((a,b) => (b[1].orders/b[1].visitors) - (a[1].orders/a[1].visitors))[0]?.[0] || 'N/A';
    })();

    return { revenue, orders, profit, aov, bestProduct, bestChannel, highestRevenueDay, highCVRChannel };
  }, [filteredData]);

  // Chart Data Preparation
  const trendData = useMemo(() => {
    const grouped = filteredData.reduce((acc, row) => {
      acc[row.date] = (acc[row.date] || 0) + row.revenue;
      return acc;
    }, {});
    return Object.entries(grouped).map(([date, revenue]) => ({ date, revenue })).sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredData]);

  const channelData = useMemo(() => {
    const grouped = filteredData.reduce((acc, row) => {
      acc[row.channel] = (acc[row.channel] || 0) + row.revenue;
      return acc;
    }, {});
    return Object.entries(grouped).map(([name, value]) => ({ name, value }));
  }, [filteredData]);

  const productData = useMemo(() => {
    const grouped = filteredData.reduce((acc, row) => {
      acc[row.product] = (acc[row.product] || 0) + row.revenue;
      return acc;
    }, {});
    return Object.entries(grouped).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 5);
  }, [filteredData]);

  const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      
      <main className="flex-1 p-6 md:p-10 overflow-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Dashboard Insights</h1>
            <p className="text-slate-500 mt-1">AI-powered analytics and performance metrics</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-xs">
              <Calendar className="w-4 h-4" />
              Custom Schedule
            </button>
          </div>
        </header>

        {/* AI Refinery Section */}
        <AIRefinery 
            metrics={metrics} 
            dataSummary={filteredData.slice(0, 10)} // Passing context for AI
        />

        {/* Core Quick Insights */}
        <div className="flex flex-wrap gap-4 mb-8">
            <InsightPill label="Best Product" value={metrics.bestProduct} icon={ShoppingBag} color="bg-blue-500" />
            <InsightPill label="Best Channel" value={metrics.bestChannel} icon={TrendingUp} color="bg-purple-500" />
            <InsightPill label="Top Revenue Day" value={metrics.highestRevenueDay} icon={Calendar} color="bg-emerald-500" />
            <InsightPill label="Top Conv. Channel" value={metrics.highCVRChannel} icon={Target} color="bg-orange-500" />
        </div>

        <FilterBar 
          filters={filters} 
          setFilters={setFilters} 
          products={products} 
          channels={channels} 
        />

        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <KPICard title="Total Revenue" value={formatCurrency(metrics.revenue)} icon={DollarSign} trend="up" trendValue="12.5%" color="bg-blue-500" />
          <KPICard title="Order Count" value={formatNumber(metrics.orders)} icon={ShoppingBag} trend="up" trendValue="8.2%" color="bg-purple-500" />
          <KPICard title="Net Profit" value={formatCurrency(metrics.profit)} icon={TrendingUp} trend="up" trendValue="14.1%" color="bg-emerald-500" />
          <KPICard title="Avg Order Value" value={formatCurrency(metrics.aov)} icon={Users} trend="down" trendValue="2.4%" color="bg-amber-500" />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <ChartCard title="Revenue Trend" className="lg:col-span-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} tickFormatter={formatCurrency} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  formatter={(value) => [formatCurrency(value), 'Revenue']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Revenue by Channel">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={channelData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} width={100} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
                  {channelData.map((e, i) => <Cell key={`c-${i}`} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
                <Tooltip formatter={(v) => formatCurrency(v)} cursor={{fill: '#f8fafc'}} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Product Share">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={productData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {productData.map((e, i) => <Cell key={`c-${i}`} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => formatCurrency(v)} />
                <Legend iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-lg font-bold">Raw Logs</h2>
            <span className="text-xs font-medium bg-slate-100 text-slate-600 px-2 py-1 rounded-full">{filteredData.length} Logs</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Date</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Product</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Channel</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Revenue</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Profit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredData.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm">{row.date}</td>
                    <td className="px-6 py-4 text-sm font-semibold">{row.product}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase">{row.channel}</span>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold">{formatCurrency(row.revenue)}</td>
                    <td className="px-6 py-4 text-sm font-bold">{formatCurrency(row.revenue - row.cost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
