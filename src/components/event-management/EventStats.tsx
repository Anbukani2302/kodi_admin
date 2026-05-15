import React, { useEffect, useState } from 'react';
import { eventManagementService, EventStats as IEventStats } from '../../services/eventManagementService';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { toast } from 'sonner';
import {
    Calendar,
    Clock,
    CheckCircle2,
    AlertTriangle,
    Users,
    MessageSquare,
    Image as ImageIcon,
    TrendingUp,
    Globe,
    Lock,
    Heart,
    Badge
} from 'lucide-react';

export function EventStats() {
    const [stats, setStats] = useState<IEventStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await eventManagementService.getEventStats();
                setStats(data);
            } catch (error) {
                toast.error('Failed to fetch event statistics');
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-100 rounded-3xl animate-pulse" />
            ))}
        </div>
    );
    if (!stats) return <div className="text-gray-500 font-bold p-10 text-center">No statistical data found.</div>;

    const statCards = [
        { title: 'Total Events', value: stats.total_events, icon: Calendar, color: 'bg-red-50 text-red-600', shadow: 'shadow-red-100' },
        { title: 'Upcoming', value: stats.upcoming, icon: Clock, color: 'bg-green-50 text-green-600', shadow: 'shadow-green-100' },
        { title: 'RSVPs', value: stats.total_rsvps, icon: Heart, color: 'bg-pink-50 text-pink-600', shadow: 'shadow-pink-100' },
        { title: 'Flagged', value: stats.flagged_count, icon: AlertTriangle, color: 'bg-red-50 text-red-600', shadow: 'shadow-red-100' },
    ];

    return (
        <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {statCards.map((stat, index) => (
                    <Card key={index} className={`bg-white border-none shadow-xl ${stat.shadow}/50 rounded-3xl overflow-hidden ring-1 ring-gray-100 hover:scale-[1.02] transition-transform duration-300`}>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className={`p-3 rounded-2xl ${stat.color}`}>
                                    <stat.icon className="w-5 h-5" />
                                </div>
                                <div className="flex items-center gap-1 text-green-500 bg-green-50 px-2 py-0.5 rounded-full text-[10px] font-black uppercase">
                                    <TrendingUp className="w-3 h-3" />
                                    Live
                                </div>
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-500 tracking-tight">{stat.title}</p>
                                <p className="text-3xl font-black text-gray-900 mt-1">{stat.value}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <Card className="bg-white border-none shadow-xl shadow-gray-200/50 rounded-3xl ring-1 ring-gray-100">
                    <CardHeader className="border-b border-gray-50 px-8 py-6">
                        <CardTitle className="text-lg font-black text-gray-900">Event Health Distribution</CardTitle>
                    </CardHeader>
                    <CardContent className="p-8">
                        <div className="space-y-6">
                            {[
                                { label: 'Approved', val: stats.by_status.APPROVED, color: 'bg-green-500', bg: 'bg-green-50', text: 'text-green-600' },
                                { label: 'Pending', val: stats.by_status.PENDING, color: 'bg-yellow-500', bg: 'bg-yellow-50', text: 'text-yellow-600' },
                                { label: 'Rejected', val: stats.by_status.REJECTED, color: 'bg-red-500', bg: 'bg-red-50', text: 'text-red-600' },
                                { label: 'Flagged', val: stats.by_status.FLAGGED, color: 'bg-orange-500', bg: 'bg-orange-50', text: 'text-orange-600' },
                            ].map((item, i) => (
                                <div key={i} className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-bold text-gray-600">{item.label}</span>
                                        <Badge className={`${item.bg} ${item.text} border-none font-black`}>{item.val}</Badge>
                                    </div>
                                    <div className="h-2 w-full bg-gray-50 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${item.color} rounded-full transition-all duration-1000`}
                                            style={{ width: `${(item.val / stats.total_events) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white border-none shadow-xl shadow-gray-200/50 rounded-3xl ring-1 ring-gray-100">
                    <CardHeader className="border-b border-gray-50 px-8 py-6">
                        <CardTitle className="text-lg font-black text-gray-900">Visibility Analysis</CardTitle>
                    </CardHeader>
                    <CardContent className="p-8">
                        <div className="grid grid-cols-2 gap-8">
                            {[
                                { label: 'Public Content', val: stats.by_visibility.PUBLIC, icon: Globe, color: 'text-red-500' },
                                { label: 'Connected Only', val: stats.by_visibility.CONNECTED, icon: Users, color: 'text-purple-500' },
                                { label: 'Family Bounds', val: stats.by_visibility.FAMILY, icon: Heart, color: 'text-pink-500' },
                                { label: 'Private Space', val: stats.by_visibility.PRIVATE, icon: Lock, color: 'text-gray-900' },
                            ].map((item, i) => (
                                <div key={i} className="flex flex-col gap-2 p-6 rounded-3xl bg-gray-50/50 border border-gray-100 group hover:bg-white hover:shadow-lg transition-all">
                                    <item.icon className={`w-8 h-8 ${item.color} mb-2 group-hover:scale-110 transition-transform`} />
                                    <p className="text-2xl font-black text-gray-900">{item.val}</p>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-tight">{item.label}</p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
