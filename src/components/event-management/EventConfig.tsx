import React, { useEffect, useState } from 'react';
import { eventManagementService, EventConfig as IEventConfig } from '../../services/eventManagementService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from 'sonner';
import { Save, Settings2, ShieldCheck, Globe, Eye } from 'lucide-react';

export function EventConfig() {
    const [config, setConfig] = useState<IEventConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const data = await eventManagementService.getEventConfig();
                setConfig(data);
            } catch (error) {
                toast.error('Failed to fetch event configuration');
            } finally {
                setLoading(false);
            }
        };
        fetchConfig();
    }, []);

    const handleUpdate = async () => {
        if (!config) return;
        setSaving(true);
        try {
            await eventManagementService.updateEventConfig({
                default_visibility: config.default_visibility,
                max_allowed_visibility: config.max_allowed_visibility,
                auto_approve: config.auto_approve,
                require_moderation: config.require_moderation,
            });
            toast.success('Settings updated successfully', {
                className: 'bg-white text-gray-900 border border-gray-100 shadow-xl rounded-2xl',
            });
        } catch (error) {
            toast.error('Failed to update configuration');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="text-gray-400 font-bold p-10 animate-pulse text-center">Loading settings...</div>;
    if (!config) return <div className="text-gray-400 font-bold p-10 text-center">Config not found.</div>;

    return (
        <div className="max-w-4xl animate-in fade-in slide-in-from-left-4 duration-500">
            <Card className="bg-white border-none shadow-xl shadow-gray-200/50 rounded-3xl ring-1 ring-gray-100 overflow-hidden">
                <CardHeader className="bg-linear-to-r from-red-50/50 to-white border-b border-gray-50 px-8 py-8">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-red-100 rounded-2xl">
                            <Settings2 className="w-6 h-6 text-red-600" />
                        </div>
                        <div>
                            <CardTitle className="text-2xl font-black text-gray-900">Platform Governance</CardTitle>
                            <CardDescription className="text-gray-500 font-medium mt-1">
                                Configure global event behavior and community standards.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-8 space-y-10">
                    <div className="grid gap-8 sm:grid-cols-2">
                        <div className="flex items-center justify-between p-6 rounded-3xl bg-gray-50/50 border border-gray-100 group hover:border-red-200 transition-all">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <ShieldCheck className="w-4 h-4 text-gray-400 group-hover:text-red-500 transition-colors" />
                                    <Label className="text-base font-black text-gray-900 cursor-pointer">Require Moderation</Label>
                                </div>
                                <p className="text-xs text-gray-500 font-medium leading-relaxed">Safety first: All new events must be manually vetted.</p>
                            </div>
                            <Switch
                                checked={config.require_moderation}
                                onCheckedChange={(checked) => setConfig({ ...config, require_moderation: checked })}
                            />
                        </div>

                        <div className="flex items-center justify-between p-6 rounded-3xl bg-gray-50/50 border border-gray-100 group hover:border-green-200 transition-all">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                    <Label className="text-base font-black text-gray-900 cursor-pointer">Auto Approval</Label>
                                </div>
                                <p className="text-xs text-gray-500 font-medium leading-relaxed">Efficiency: Bypass review for established community members.</p>
                            </div>
                            <Switch
                                checked={config.auto_approve}
                                onCheckedChange={(checked) => setConfig({ ...config, auto_approve: checked })}
                            />
                        </div>
                    </div>

                    <div className="grid gap-8 sm:grid-cols-2">
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <Globe className="w-4 h-4 text-red-500" />
                                <Label className="text-sm font-black text-gray-700 uppercase tracking-widest">Initial Visibility</Label>
                            </div>
                            <Select
                                value={config.default_visibility.toString()}
                                onValueChange={(value) => setConfig({ ...config, default_visibility: parseInt(value) })}
                            >
                                <SelectTrigger className="bg-gray-50 border-gray-100 text-gray-900 h-12 rounded-2xl font-bold focus:ring-red-500">
                                    <SelectValue placeholder="Set visibility" />
                                </SelectTrigger>
                                <SelectContent className="bg-white border-gray-100 text-gray-900 rounded-2xl shadow-2xl">
                                    <SelectItem value="1" className="font-bold">🌍 Public</SelectItem>
                                    <SelectItem value="2" className="font-bold">🔗 Connected</SelectItem>
                                    <SelectItem value="3" className="font-bold">🏠 Family</SelectItem>
                                    <SelectItem value="4" className="font-bold">🔒 Private</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <Eye className="w-4 h-4 text-orange-500" />
                                <Label className="text-sm font-black text-gray-700 uppercase tracking-widest">Visibility Ceiling</Label>
                            </div>
                            <Select
                                value={config.max_allowed_visibility}
                                onValueChange={(value) => setConfig({ ...config, max_allowed_visibility: value })}
                            >
                                <SelectTrigger className="bg-gray-50 border-gray-100 text-gray-900 h-12 rounded-2xl font-bold focus:ring-red-500">
                                    <SelectValue placeholder="Set maximum" />
                                </SelectTrigger>
                                <SelectContent className="bg-white border-gray-100 text-gray-900 rounded-2xl shadow-2xl">
                                    <SelectItem value="PUBLIC" className="font-bold text-red-600">PUBLIC</SelectItem>
                                    <SelectItem value="CONNECTED" className="font-bold text-purple-600">CONNECTED</SelectItem>
                                    <SelectItem value="FAMILY" className="font-bold text-pink-600">FAMILY</SelectItem>
                                    <SelectItem value="PRIVATE" className="font-bold text-gray-600">PRIVATE</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="pt-6">
                        <Button
                            onClick={handleUpdate}
                            disabled={saving}
                            className="w-full bg-gray-900 hover:bg-black text-white h-14 rounded-2xl font-black text-lg transition-all shadow-xl shadow-gray-200 active:scale-95"
                        >
                            {saving ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                    Applying Changes...
                                </div>
                            ) : (
                                <>
                                    <Save className="w-5 h-5 mr-2.5" />
                                    Synchronize Settings
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
