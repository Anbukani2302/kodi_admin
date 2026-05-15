import React, { useEffect, useState } from 'react';
import { eventManagementService, Event, EventFlagsResponse, EventFlag } from '../../services/eventManagementService';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';
import { Flag, X, Check, ShieldAlert, User, Eye, AlertCircle, Clock, MapPin, Calendar, Users, MessageSquare, Image } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';

// Reason choices from backend
const REASON_CHOICES = [
  { value: 'INAPPROPRIATE', label: 'Inappropriate content' },
  { value: 'SPAM', label: 'Spam' },
  { value: 'WRONG_VISIBILITY', label: 'Wrong visibility settings' },
  { value: 'HARASSMENT', label: 'Harassment' },
  { value: 'FAKE', label: 'Fake event' },
  { value: 'OTHER', label: 'Other' },
];

export function FlaggedEvents() {
  const { t } = useLanguage();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [flagsData, setFlagsData] = useState<EventFlagsResponse | null>(null);
  const [showFlagsModal, setShowFlagsModal] = useState(false);
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [selectedFlag, setSelectedFlag] = useState<EventFlag | null>(null);
  const [resolveAction, setResolveAction] = useState<'RESOLVED' | 'DISMISSED'>('RESOLVED');
  const [resolveNote, setResolveNote] = useState('');
  const [flagReason, setFlagReason] = useState('INAPPROPRIATE');
  const [flagDescription, setFlagDescription] = useState('');
  const [processingId, setProcessingId] = useState<number | null>(null);

  const fetchFlaggedEvents = async () => {
    try {
      const response = await eventManagementService.getFlaggedEvents();

      const data = response as any;
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        setEvents(data.results || data.data || []);
      } else {
        setEvents(Array.isArray(data) ? data : []);
      }
    } catch (error: any) {
      console.error('Error fetching flagged events:', error);

      // Check for 403 Forbidden status
      if (error.response?.status === 403) {
        const errorMessage = error.response?.data?.detail || error.response?.data?.error || error.response?.data?.message || 'You do not have permission to perform this action.';
        console.log('FlaggedEvents: 403 permission denied - showing access denied message');
        // Show access denied message instead of empty state
        setEvents([{
          id: 0,
          title: 'Access Denied',
          status: 'PENDING',
          start_date: new Date().toISOString(),
          end_date: null,
          event_type: { id: 0, title: 'Permission Required' },
          created_by: { id: 0, full_name: 'System' },
          created_by_name: 'System',
          is_all_day: false,
          visibility: 1,
          visibility_name: 'Private',
          description: 'You do not have permission to view flagged events.',
          location: null,
          rsvp_count: 0,
          cover_image_url: null,
          created_at: new Date().toISOString()
        } as any]);
        setLoading(false);
        return;
      }

      toast.error('Failed to fetch flagged events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlaggedEvents();
  }, []);

  const handleViewReports = async (event: Event) => {
    try {
      setSelectedEvent(event);
      const data = await eventManagementService.getEventFlags(event.id);
      setFlagsData(data);
      setShowFlagsModal(true);
    } catch (error) {
      toast.error('Failed to fetch event flags');
    }
  };

  const handleFlagEvent = async () => {
    if (!selectedEvent) return;

    try {
      setProcessingId(selectedEvent.id);
      await eventManagementService.flagEvent(selectedEvent.id, {
        reason: flagReason,
        description: flagDescription,
      });
      toast.success('Event flagged successfully');
      setShowFlagModal(false);
      setFlagReason('INAPPROPRIATE');
      setFlagDescription('');
      fetchFlaggedEvents(); // Refresh the list
    } catch (error) {
      toast.error('Failed to flag event');
    } finally {
      setProcessingId(null);
    }
  };

  const handleResolveFlag = async () => {
    if (!selectedFlag) return;

    try {
      setProcessingId(selectedFlag.id);
      const action: "approve" | "reject" = resolveAction === 'RESOLVED' ? 'approve' : 'reject';
      await eventManagementService.resolveFlag(selectedFlag.id, {
        action,
        note: resolveNote,
      });
      toast.success(`Flag ${resolveAction === 'RESOLVED' ? 'resolved' : 'dismissed'} successfully`);
      setShowResolveModal(false);
      setResolveNote('');
      setSelectedFlag(null);

      // Refresh flags data if modal is open
      if (selectedEvent && showFlagsModal) {
        const updatedFlags = await eventManagementService.getEventFlags(selectedEvent.id);
        setFlagsData(updatedFlags);
      }

      fetchFlaggedEvents(); // Refresh the main list
    } catch (error) {
      toast.error('Failed to resolve flag');
    } finally {
      setProcessingId(null);
    }
  };

  const openResolveModal = (flag: EventFlag, action: 'RESOLVED' | 'DISMISSED') => {
    setSelectedFlag(flag);
    setResolveAction(action);
    setResolveNote('');
    setShowResolveModal(true);
    setShowFlagsModal(false); // Close flags modal temporarily
  };

  const getReasonLabel = (reason: string) => {
    const found = REASON_CHOICES.find(r => r.value === reason);
    return found ? found.label : reason;
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      PENDING: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      RESOLVED: 'bg-green-100 text-green-700 border-green-200',
      DISMISSED: 'bg-gray-100 text-gray-700 border-gray-200',
    };
    return styles[status as keyof typeof styles] || styles.PENDING;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-pulse">
        <div className="w-12 h-12 border-4 border-red-600/20 border-t-red-600 rounded-full animate-spin mb-4" />
        <p className="text-gray-500 font-bold tracking-tight">Checking reported content...</p>
      </div>
    );
  }

  return (
    <>
      <Card className="bg-white border-none shadow-xl shadow-red-100/30 rounded-3xl overflow-hidden ring-1 ring-gray-200">
        <CardHeader className="bg-linear-to-r from-red-50 to-white border-b border-red-100 px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-xl">
                <ShieldAlert className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <CardTitle className="text-xl font-black text-gray-900">Flagged Content</CardTitle>
                <p className="text-sm text-red-600/60 font-medium mt-0.5">Community reported violations</p>
              </div>
            </div>
            <Badge className="bg-red-600 text-white border-none px-3 py-1 rounded-full font-bold shadow-lg shadow-red-200">
              {events.length} Urgent
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {events.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-500" />
              </div>
              <p className="text-gray-400 font-bold text-lg">Clean sweep!</p>
              <p className="text-gray-400 text-sm">No flagged events reported.</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-gray-50/50">
                <TableRow className="hover:bg-transparent border-gray-100">
                  <TableHead className="px-8 py-4 text-gray-400 font-black uppercase text-[10px] tracking-widest w-1/2">{t('Events') || 'Events'}</TableHead>
                  <TableHead className="py-4 text-gray-400 font-black uppercase text-[10px] tracking-widest w-1/4">{t('FullName') || 'Full Name'}</TableHead>
                  <TableHead className="px-8 py-4 text-right text-gray-400 font-black uppercase text-[10px] tracking-widest w-1/4">{t('Action') || 'Action'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((event) => (
                  <TableRow key={event.id} className="group hover:bg-gray-50/50 transition-colors border-gray-100">
                    <TableCell className="px-8 py-5">
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-gray-900">{event.title}</span>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-blue-50 text-blue-600 border-blue-100 uppercase whitespace-nowrap">
                            {typeof event.event_type === 'object' ? (event.event_type as any).title : (event.event_type_title || event.event_type)}
                          </Badge>
                          <div className="flex items-center gap-1 text-[10px] text-gray-400 whitespace-nowrap">
                            <Calendar className="w-3 h-3" />
                            {new Date(event.start_date).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-1.5 ml-2">
                            <Badge className={`${getStatusBadge(event.status)} border px-2 py-0.5 text-[10px] font-bold min-w-17.5 justify-center`}>
                              {event.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-5">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-gray-900">
                          <User className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-sm font-bold">
                            {typeof event.created_by === 'object' ? (event.created_by as any).full_name : (event.created_by_name || 'Unknown')}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl font-bold px-4"
                          onClick={() => handleViewReports(event)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          {t('ViewReports') || 'View Reports'}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* View Reports Modal */}
      <Dialog open={showFlagsModal} onOpenChange={setShowFlagsModal}>
        <DialogContent className="sm:max-w-2xl bg-white rounded-2xl shadow-2xl border-0 p-0 overflow-hidden">
          <DialogHeader className="bg-linear-to-r from-red-50 to-white border-b border-red-100 px-6 py-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-red-100 rounded-lg">
                <Flag className="w-4 h-4 text-red-600" />
              </div>
              <DialogTitle className="text-lg font-black text-gray-900">
                Reports for: {flagsData?.event_title}
              </DialogTitle>
            </div>
            <DialogDescription className="text-sm text-gray-500 mt-1">
              Total Reports: {flagsData?.total_flags || 0}
            </DialogDescription>
          </DialogHeader>

          <div className="px-6 py-4 max-h-[60vh] overflow-y-auto space-y-4">
            {/* Event Cover Image */}
            {selectedEvent?.cover_image_url && (
              <div className="relative w-full h-64 rounded-xl overflow-hidden bg-black border border-gray-100 mb-4 flex items-center justify-center">
                <img
                  src={selectedEvent.cover_image_url.startsWith('http')
                    ? selectedEvent.cover_image_url
                    : `${import.meta.env.VITE_API_URL || 'http://192.168.1.15:8002'}${selectedEvent.cover_image_url}`}
                  alt={selectedEvent.title}
                  className="max-w-full max-h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/placeholder-event.jpg';
                  }}
                />
              </div>
            )}

            {flagsData?.flags && flagsData.flags.length > 0 ? (
              <div className="space-y-4">
                {flagsData.flags.map((flag) => (
                  <div key={flag.id} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <Badge className={`${getStatusBadge(flag.status)} border px-2 py-0.5 text-[10px] font-bold min-w-17.5 justify-center`}>
                          {flag.status}
                        </Badge>
                        <h4 className="font-bold text-gray-900 mt-2">
                          {getReasonLabel(flag.reason)}
                        </h4>
                      </div>
                      <span className="text-xs text-gray-400">
                        {new Date(flag.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    {flag.description && (
                      <p className="text-sm text-gray-600 bg-white p-3 rounded-lg border border-gray-100 mb-3">
                        "{flag.description}"
                      </p>
                    )}

                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>Reported by: {flag.reported_by}</span>

                      {flag.status === 'PENDING' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-green-600 border-green-200 hover:bg-green-50 text-xs font-bold rounded-lg"
                            onClick={() => openResolveModal(flag, 'RESOLVED')}
                            disabled={processingId === flag.id}
                          >
                            {processingId === flag.id ? 'Processing...' : 'Keep'}
                          </Button>
                          <Button
                            size="sm"
                            className="h-8 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg"
                            onClick={() => openResolveModal(flag, 'DISMISSED')}
                            disabled={processingId === flag.id}
                          >
                            Remove Content
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-400 font-medium">No reports found</p>
              </div>
            )}
          </div>

          <DialogFooter className="bg-gray-50 border-t border-gray-100 px-6 py-4">
            <Button
              variant="outline"
              onClick={() => setShowFlagsModal(false)}
              className="rounded-xl font-bold"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Flag Event Modal */}
      <Dialog open={showFlagModal} onOpenChange={setShowFlagModal}>
        <DialogContent className="sm:max-w-md bg-white rounded-2xl shadow-2xl border-0">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-gray-900">Report Event</DialogTitle>
            <DialogDescription>
              Please provide details about why you're reporting this event.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-sm font-bold text-gray-700">Reason</Label>
              <RadioGroup value={flagReason} onValueChange={setFlagReason} className="grid grid-cols-1 gap-2">
                {REASON_CHOICES.map((reason) => (
                  <div key={reason.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={reason.value} id={reason.value} />
                    <Label htmlFor={reason.value} className="text-sm text-gray-600">{reason.label}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-bold text-gray-700">Description (Optional)</Label>
              <Textarea
                value={flagDescription}
                onChange={(e) => setFlagDescription(e.target.value)}
                placeholder="Provide additional details..."
                className="resize-none rounded-xl border-gray-200 focus:border-red-300 focus:ring-red-200"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowFlagModal(false)}
              className="rounded-xl font-bold"
            >
              Cancel
            </Button>
            <Button
              onClick={handleFlagEvent}
              disabled={processingId === selectedEvent?.id}
              className="bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold"
            >
              {processingId === selectedEvent?.id ? 'Submitting...' : 'Submit Report'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resolve Flag Modal */}
      <Dialog open={showResolveModal} onOpenChange={setShowResolveModal}>
        <DialogContent className="sm:max-w-md bg-white rounded-2xl shadow-2xl border-0">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-gray-900">
              {resolveAction === 'RESOLVED' ? 'Resolve Report' : 'Dismiss Report'}
            </DialogTitle>
            <DialogDescription>
              {resolveAction === 'RESOLVED'
                ? 'Add a note about how this issue was resolved.'
                : 'Add a note explaining why this report is being dismissed.'}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="space-y-2">
              <Label className="text-sm font-bold text-gray-700">Note</Label>
              <Textarea
                value={resolveNote}
                onChange={(e) => setResolveNote(e.target.value)}
                placeholder={resolveAction === 'RESOLVED'
                  ? "e.g., Removed inappropriate content, warning sent to user"
                  : "e.g., Content is appropriate, no action needed"}
                className="resize-none rounded-xl border-gray-200 focus:border-red-300 focus:ring-red-200"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowResolveModal(false)}
              className="rounded-xl font-bold"
            >
              Cancel
            </Button>
            <Button
              onClick={handleResolveFlag}
              disabled={processingId === selectedFlag?.id}
              className={resolveAction === 'RESOLVED'
                ? "bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold"
                : "bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-bold"
              }
            >
              {processingId === selectedFlag?.id
                ? 'Processing...'
                : resolveAction === 'RESOLVED' ? 'Confirm Keep' : 'Confirm Dismiss'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}