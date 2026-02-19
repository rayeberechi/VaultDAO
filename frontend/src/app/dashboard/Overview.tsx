import React, { useEffect, useState } from 'react';
import StatCard from '../../components/Layout/StatCard';
import { useVaultContract } from '../../hooks/useVaultContract';
import { LayoutDashboard, FileText, CheckCircle, Wallet, Clock, ArrowUpRight } from 'lucide-react';

const Overview: React.FC = () => {
    const { getDashboardStats, getSpendingLimits, getRecentActivity } = useVaultContract();
    const [stats, setStats] = useState<any>(null);
    const [limits, setLimits] = useState<any>(null);
    const [activity, setActivity] = useState<any[]>([]);

    useEffect(() => {
        let isMounted = true;
        const fetchData = async () => {
            const [s, l, a] = await Promise.all([
                getDashboardStats(), 
                getSpendingLimits(),
                getRecentActivity()
            ]);
            if (isMounted) {
                setStats(s);
                setLimits(l);
                setActivity(a);
            }
        };
        fetchData();
        return () => { isMounted = false; };
    }, []);

    const getProgress = (used: number, limit: number) => (limit > 0 ? Math.min((used / limit) * 100, 100) : 0);
    
    const getProgressColor = (percent: number) => {
        if (percent > 80) return 'bg-red-500';
        if (percent > 50) return 'bg-yellow-500';
        return 'bg-green-500';
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'Executed': return 'text-green-400 bg-green-400/10';
            case 'Pending': return 'text-yellow-400 bg-yellow-400/10';
            case 'Rejected': return 'text-red-400 bg-red-400/10';
            default: return 'text-gray-400 bg-gray-400/10';
        }
    };

    return (
        <div className="space-y-8 pb-10">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold text-white tracking-tight">Treasury Overview</h2>
                <div className="text-sm text-gray-400 flex items-center gap-2 bg-secondary px-4 py-2 rounded-lg border border-gray-800">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span>Network: Testnet</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Vault Balance" value="$12,450.00" trend={{ value: "2.4%", isPositive: true }} icon={Wallet} variant="primary" />
                <StatCard title="Active Proposals" value={stats?.totalProposals || 0} subtitle={`${stats?.pendingApprovals || 0} pending your vote`} icon={FileText} variant="warning" />
                <StatCard title="Ready to Execute" value={stats?.readyToExecute || 0} subtitle="Passed timelock" icon={CheckCircle} variant="success" />
                <StatCard title="Active Signers" value={stats?.activeSigners || 0} subtitle={`Threshold: ${stats?.threshold || "0/0"}`} icon={LayoutDashboard} variant="primary" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Spending Limits */}
                <div className="bg-secondary p-6 rounded-xl border border-gray-800 shadow-xl">
                    <h3 className="text-xl font-semibold text-white mb-6">Spending Limits</h3>
                    <div className="space-y-8">
                        {[
                            { label: 'Daily Limit', key: 'daily' },
                            { label: 'Weekly Limit', key: 'weekly' }
                        ].map((item) => {
                            const data = limits?.[item.key] || { used: 0, limit: 0 };
                            const percent = getProgress(data.used, data.limit);
                            return (
                                <div key={item.key}>
                                    <div className="flex justify-between text-sm mb-3">
                                        <span className="text-gray-300 font-medium">{item.label}</span>
                                        <span className="text-gray-400 font-mono">{data.used} / {data.limit} XLM</span>
                                    </div>
                                    <div className="w-full bg-primary rounded-full h-3 border border-gray-700 overflow-hidden">
                                        <div className={`${getProgressColor(percent)} h-full rounded-full transition-all duration-700`} style={{ width: `${percent}%` }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Recent Activity List */}
                <div className="bg-secondary p-6 rounded-xl border border-gray-800 shadow-xl">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-semibold text-white">Recent Activity</h3>
                        <button className="text-accent text-sm font-medium hover:underline">View All</button>
                    </div>
                    <div className="space-y-4">
                        {activity.map((item) => (
                            <div key={item.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors border border-transparent hover:border-gray-800">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-primary rounded-lg text-accent">
                                        <ArrowUpRight size={18} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-white">{item.type} #{item.id}</p>
                                        <p className="text-xs text-gray-500">{item.date} • {item.amount}</p>
                                    </div>
                                </div>
                                <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded ${getStatusStyle(item.status)}`}>
                                    {item.status}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Overview;