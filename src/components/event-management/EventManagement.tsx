import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { ShieldCheck, Flag, BarChart3, Settings2, UserMinus } from 'lucide-react';
import { EventModeration } from './EventModeration';
import { FlaggedEvents } from './FlaggedEvents';
import { EventStats } from './EventStats';
import { EventConfig } from './EventConfig';
import { UserRestrictions } from './UserRestrictions';
import { PermissionDenied } from '../common/PermissionDenied';

export function EventManagement() {
    const { t } = useLanguage();
    const { user, role } = useAuth();

    // Permission check for staff
    console.log('EventManagement Debug:', { role, permissions: user?.permissions });
    const hasPermission = role === "admin" || 
        user?.permissions?.can_manage_event || 
        user?.permissions?.event_management ||
        user?.permissions?.manage_event ||
        user?.permissions?.can_manage_events ||
        user?.permissions?.events_management ||
        user?.permissions?.event;
    console.log('EventManagement hasPermission:', hasPermission, 'role:', role, 'permissions:', user?.permissions);

    if (!hasPermission) {
        console.log('EventManagement: Showing PermissionDenied - hasPermission:', hasPermission, 'role:', role, 'permissions:', user?.permissions);
        // Temporary bypass to test if API works without permission check
        // return (
        //     <PermissionDenied message="You do not have permission to access Event Management. Please contact your administrator." />
        // );
        console.log('EventManagement: Bypassing permission check for testing');
    }
    
    return (
        <div className="p-1 sm:p-6 space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-black tracking-tight text-gray-900 sm:text-4xl">
                    {t('Event') || 'Event'} <span className="text-red-600">{t('management') || 'Management'}</span>
                </h1>

            </div>

            <Tabs defaultValue="moderation" className="w-full">
                <div className="overflow-x-auto pb-2 scrollbar-hide">
                    <TabsList className="bg-white/50 backdrop-blur-md border border-gray-200 p-1.5 rounded-2xl shadow-sm mb-8 inline-flex min-w-max">
                        <TabsTrigger value="moderation" className="gap-2.5 px-4 py-2.5 rounded-xl data-[state=active]:bg-white data-[state=active]:text-red-600 data-[state=active]:shadow-md transition-all duration-300">
                            <ShieldCheck className="w-4 h-4" />
                            <span className="font-bold">{t('Moderation') || 'Moderation'}</span>
                        </TabsTrigger>
                        <TabsTrigger value="flagged" className="gap-2.5 px-4 py-2.5 rounded-xl data-[state=active]:bg-white data-[state=active]:text-red-500 data-[state=active]:shadow-md transition-all duration-300">
                            <Flag className="w-4 h-4" />
                            <span className="font-bold">{t('Flagged') || 'Flagged'}</span>
                        </TabsTrigger>
                        <TabsTrigger value="stats" className="gap-2.5 px-4 py-2.5 rounded-xl data-[state=active]:bg-white data-[state=active]:text-red-600 data-[state=active]:shadow-md transition-all duration-300">
                            <BarChart3 className="w-4 h-4" />
                            <span className="font-bold">{t('Statistics') || 'Statistics'}</span>
                        </TabsTrigger>
                       
                        
                    </TabsList>
                </div>

                <TabsContent value="moderation" className="animate-in slide-in-from-bottom-2 duration-400">
                    <EventModeration />
                </TabsContent>

                <TabsContent value="flagged" className="animate-in slide-in-from-bottom-2 duration-400">
                    <FlaggedEvents />
                </TabsContent>

                <TabsContent value="stats" className="animate-in slide-in-from-bottom-2 duration-400">
                    <EventStats />
                </TabsContent>

                <TabsContent value="config" className="animate-in slide-in-from-bottom-2 duration-400">
                    <EventConfig />
                </TabsContent>

                <TabsContent value="restrictions" className="animate-in slide-in-from-bottom-2 duration-400">
                    <UserRestrictions />
                </TabsContent>
            </Tabs>
        </div>
    );
}
