import React, { useEffect, useState } from "react";
import {
  eventManagementService,
  Event,
  EventFlagsResponse,
} from "../../services/eventManagementService";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { toast } from "sonner";
import {
  Check,
  X,
  Clock,
  User,
  AlertTriangle,
  ShieldAlert,
  Eye,
  EyeOff,
  Info,
  Calendar,
  MapPin,
  EyeIcon,
} from "lucide-react";
import { format } from "date-fns";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";

// Visibility choices from backend
const VISIBILITY_CHOICES = [
  { id: 1, value: "PUBLIC", label: "🌍 Public - Everyone" },
  { id: 2, value: "CONNECTED", label: "👥 Connected People Only" },
  { id: 3, value: "FAMILY", label: "👪 Same Family Only" },
  { id: 4, value: "familyname8", label: "🕉️ Same familyname8 Only" },
  { id: 5, value: "lifestyle", label: "⛪ Same lifestyle Only" },
  { id: 6, value: "LOCATION", label: "📍 Same Location Only" },
  { id: 7, value: "PRIVATE", label: "🔒 Only Me" },
];

// Reason choices from backend
const REASON_CHOICES = [
  { value: "INAPPROPRIATE", label: "Inappropriate content" },
  { value: "SPAM", label: "Spam" },
  { value: "WRONG_VISIBILITY", label: "Wrong visibility settings" },
  { value: "HARASSMENT", label: "Harassment" },
  { value: "FAKE", label: "Fake event" },
  { value: "OTHER", label: "Other" },
];

export function EventModeration() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  const [filter, setFilter] = useState<
    "ALL" | "PENDING" | "APPROVED" | "REJECTED"
  >("ALL");
  const [confirmAction, setConfirmAction] = useState<{
    open: boolean;
    eventId: number | null;
    action?: "approve" | "reject";
  }>({
    open: false,
    eventId: null,
  });

  // View event details modal
  const [viewModal, setViewModal] = useState<{
    open: boolean;
    event: Event | null;
  }>({
    open: false,
    event: null,
  });

  // Visibility restriction modal state
  const [visibilityModal, setVisibilityModal] = useState<{
    open: boolean;
    event: Event | null;
  }>({
    open: false,
    event: null,
  });
  const [selectedVisibilities, setSelectedVisibilities] = useState<number[]>(
    []
  );
  const [restrictingUser, setRestrictingUser] = useState(false);

  // Action response modal
  const [actionResponseModal, setActionResponseModal] = useState<{
    open: boolean;
    message: string;
    action: string;
  }>({
    open: false,
    message: "",
    action: "",
  });

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await eventManagementService.getEventsByStatus(filter);
      console.log("Fetched events for filter", filter, ":", response);

      const data = response as any;
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        setEvents(data.results || data.data || []);
      } else {
        setEvents(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      toast.error("Failed to fetch events");
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [filter]);

  const handleModerate = async (id: number, action: "approve" | "reject") => {
    try {
      const response = await eventManagementService.moderateEvent(id, action);
      toast.success(
        `Event ${action === "approve" ? "approved" : "rejected"} successfully`
      );

      setActionResponseModal({
        open: true,
        message:
          response.message ||
          `Event ${action === "approve" ? "approved" : "rejected"
          } successfully`,
        action: action === "approve" ? "APPROVED" : "REJECTED",
      });

      setEvents(events.filter((e) => e.id !== id));
      setConfirmAction({ open: false, eventId: null });
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || `Failed to ${action} event`;
      toast.error(errorMessage);

      setActionResponseModal({
        open: true,
        message: errorMessage,
        action: "ERROR",
      });
    }
  };

  const handleViewDetails = (event: Event) => {
    setViewModal({ open: true, event });
  };

  const handleVisibilityRestriction = (event: Event) => {
    setVisibilityModal({ open: true, event });
    setSelectedVisibilities([]); // Reset selections
  };

  const handleApplyRestriction = async () => {
    if (!visibilityModal.event) return;

    try {
      setRestrictingUser(true);

      // Get user ID - in your data, created_by is a number (user ID)
      const userId =
        typeof visibilityModal.event.created_by === "object"
          ? visibilityModal.event.created_by?.id
          : visibilityModal.event.created_by;

      console.log("User ID found:", userId);

      if (!userId) {
        toast.error("Could not identify user ID. Please check event data.");
        setRestrictingUser(false);
        return;
      }

      // Prepare the payload
      const payload = {
        user_id: userId,
        restricted_to_visibility: selectedVisibilities,
        can_create_events: true,
        max_visibility: "PRIVATE",
        blocked_lifestyles: [],
        blocked_familyname8s: [],
        blocked_families: [],
        restriction_reason: "User restricted based on event moderation",
      };

      // Log the full payload before sending
      console.log("Full Payload being sent:", payload);

      const response = await eventManagementService.restrictUser(payload);

      // Log the response
      console.log("API Response:", response);

      toast.success("User visibility restrictions applied successfully");

      setActionResponseModal({
        open: true,
        message:
          response.message ||
          "User visibility restrictions applied successfully",
        action: "RESTRICTED",
      });

      setVisibilityModal({ open: false, event: null });
      setSelectedVisibilities([]);
    } catch (error: any) {
      console.error("Error applying restrictions:", error);

      // Show error response in modal if available
      const errorMessage =
        error.response?.data?.message ||
        "Failed to apply visibility restrictions";

      setActionResponseModal({
        open: true,
        message: errorMessage,
        action: "ERROR",
      });
    } finally {
      setRestrictingUser(false);
    }
  };

  const getEventStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return (
          <Badge className="bg-green-100 text-green-700 border-green-200 px-3 py-1 text-xs font-bold rounded-full">
            Approved
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge className="bg-red-100 text-red-700 border-red-200 px-3 py-1 text-xs font-bold rounded-full">
            Rejected
          </Badge>
        );
      case "PENDING":
        return (
          <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 px-3 py-1 text-xs font-bold rounded-full">
            Pending
          </Badge>
        );
      case "FLAGGED":
        return (
          <Badge className="bg-purple-100 text-purple-700 border-purple-200 px-3 py-1 text-xs font-bold rounded-full">
            Flagged
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-700 border-gray-200 px-3 py-1 text-xs font-bold rounded-full">
            {status}
          </Badge>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-pulse">
        <div className="w-12 h-12 border-4 border-red-600/20 border-t-red-600 rounded-full animate-spin mb-4" />
        <p className="text-gray-500 font-bold tracking-tight">
          Loading events...
        </p>
      </div>
    );
  }

  return (
    <Card className="bg-white border-gray-200 shadow-xl shadow-gray-200/50 rounded-3xl overflow-hidden border-none ring-1 ring-gray-200">
      <CardHeader className="bg-linear-to-r from-gray-50 to-white border-b border-gray-100 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-black text-gray-900">
              Event Moderation
            </CardTitle>
            <p className="text-sm text-gray-500 font-medium mt-1">
              Review and manage all community events
            </p>
          </div>
          <Badge className="bg-red-50 text-red-600 border-red-100 px-3 py-1 rounded-full font-bold">
            {events.length} Events
          </Badge>
        </div>
        <div className="mt-6">
          <Tabs value={filter} onValueChange={(v: string | undefined) => setFilter(v as "ALL" | "PENDING" | "APPROVED" | "REJECTED")}>
            <TabsList className="bg-white border border-gray-100 p-1 shadow-xs rounded-xl h-auto">
              <TabsTrigger
                value="ALL"
                className="rounded-lg px-4 py-2 font-bold data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900 data-[state=active]:shadow-none text-gray-500"
              >
                All Events
              </TabsTrigger>
              <TabsTrigger
                value="PENDING"
                className="rounded-lg px-4 py-2 font-bold data-[state=active]:bg-yellow-100 data-[state=active]:text-yellow-800 data-[state=active]:shadow-none text-gray-500"
              >
                Pending
              </TabsTrigger>
              <TabsTrigger
                value="APPROVED"
                className="rounded-lg px-4 py-2 font-bold data-[state=active]:bg-green-100 data-[state=active]:text-green-800 data-[state=active]:shadow-none text-gray-500"
              >
                Approved
              </TabsTrigger>
              <TabsTrigger
                value="REJECTED"
                className="rounded-lg px-4 py-2 font-bold data-[state=active]:bg-red-100 data-[state=active]:text-red-800 data-[state=active]:shadow-none text-gray-500"
              >
                Rejected
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {events.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-gray-400 font-bold text-lg">No events found</p>
            <p className="text-gray-400 text-sm">
              There are no events matching the selected filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50/50">
                <TableRow className="hover:bg-transparent border-gray-100">
                  <TableHead className="px-4 py-4 text-gray-400 font-black uppercase text-[10px] tracking-widest w-16">
                    ID
                  </TableHead>
                  <TableHead className="px-4 py-4 text-gray-400 font-black uppercase text-[10px] tracking-widest min-w-50">
                    Event
                  </TableHead>
                  <TableHead className="px-4 py-4 text-gray-400 font-black uppercase text-[10px] tracking-widest w-24">
                    Type
                  </TableHead>
                  <TableHead className="px-4 py-4 text-gray-400 font-black uppercase text-[10px] tracking-widest w-32">
                    Created By
                  </TableHead>
                  <TableHead className="px-4 py-4 text-gray-400 font-black uppercase text-[10px] tracking-widest w-32">
                    Date
                  </TableHead>
                  <TableHead className="px-4 py-4 text-gray-400 font-black uppercase text-[10px] tracking-widest w-24">
                    Status
                  </TableHead>
                  <TableHead className="px-4 py-4 text-gray-400 font-black uppercase text-[10px] tracking-widest text-right w-24">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((event) => (
                  <TableRow
                    key={event.id}
                    className="group hover:bg-gray-50/50 transition-colors border-gray-100"
                  >
                    <TableCell className="px-4 py-3 font-mono text-xs text-gray-500">
                      #{event.id}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="flex flex-col gap-0.5 max-w-50">
                        <span
                          className="font-bold text-gray-900 group-hover:text-red-600 transition-colors truncate"
                          title={event.title}
                        >
                          {event.title}
                        </span>
                        <span
                          className="text-xs text-gray-400 truncate"
                          title={event.description}
                        >
                          {event.description}
                        </span>
                        {(event as any).location_name && (
                          <span
                            className="text-xs text-gray-400 flex items-center gap-1 mt-0.5 truncate"
                            title={(event as any).location_name}
                          >
                            <MapPin className="w-3 h-3 shrink-0" />
                            <span className="truncate">
                              {(event as any).location_name}
                            </span>
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Badge className="bg-red-50 text-red-700 border-red-100 px-2 py-0.5 text-xs font-bold whitespace-nowrap">
                        {typeof (event as any).event_type === 'object' ? (event as any).event_type?.title : ((event as any).event_type_title || `Type ${(event as any).event_type || "-"}`)}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-red-50 rounded-full flex items-center justify-center shrink-0">
                          <User className="w-3 h-3 text-red-500" />
                        </div>
                        <span
                          className="text-xs font-medium text-gray-700 truncate max-w-20"
                          title={typeof (event as any).created_by === 'object' ? (event as any).created_by?.full_name : (event as any).created_by_name}
                        >
                          {typeof (event as any).created_by === 'object' ? (event as any).created_by?.full_name : ((event as any).created_by_name || "Unknown")}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1 text-gray-500">
                          <Calendar className="w-3 h-3 shrink-0" />
                          <span className="text-xs whitespace-nowrap">
                            {(event as any).start_date
                              ? format(
                                new Date((event as any).start_date),
                                "MMM d, yyyy"
                              )
                              : format(
                                new Date(event.created_at),
                                "MMM d, yyyy"
                              )}
                          </span>
                        </div>
                        {(event as any).start_date && (
                          <div className="flex items-center gap-1 text-gray-400">
                            <Clock className="w-3 h-3 shrink-0" />
                            <span className="text-xs whitespace-nowrap">
                              {format(
                                new Date((event as any).start_date),
                                "h:mm a"
                              )}
                            </span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      {getEventStatusBadge(event.status)}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1 flex-nowrap">
                        {/* View Details Button */}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg w-8 h-8 p-0"
                          onClick={() => handleViewDetails(event)}
                          title="View details"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </Button>

                        {/* Visibility button for non-rejected events */}
                        {event.status !== "REJECTED" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg w-8 h-8 p-0"
                            onClick={() => handleVisibilityRestriction(event)}
                            title="Restrict user visibility"
                          >
                            <EyeOff className="w-4 h-4" />
                          </Button>
                        )}

                        {/* Approve/Reject buttons for pending events */}
                        {event.status === "PENDING" && (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg w-8 h-8 p-0"
                              onClick={() =>
                                setConfirmAction({
                                  open: true,
                                  eventId: event.id,
                                  action: "reject",
                                })
                              }
                              title="Reject event"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              className="bg-red-600 hover:bg-red-700 text-white rounded-lg w-8 h-8 p-0 shadow-sm"
                              onClick={() =>
                                setConfirmAction({
                                  open: true,
                                  eventId: event.id,
                                  action: "approve",
                                })
                              }
                              title="Approve event"
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* View Details Dialog */}
      <Dialog
        open={viewModal.open}
        onOpenChange={(open: boolean) =>
          !open && setViewModal({ open: false, event: null })
        }
      >
        <DialogContent className="max-w-2xl bg-white rounded-2xl shadow-2xl border-0 max-h-[85vh] overflow-y-auto">
          {viewModal.event && (
            <>
              <DialogHeader className="pb-4 border-b border-gray-100">
                <DialogTitle className="text-xl font-black text-gray-900 flex items-center gap-2">
                  <EyeIcon className="w-5 h-5 text-red-600" />
                  Event Details - #{viewModal.event.id}
                </DialogTitle>
              </DialogHeader>

              <div className="py-4 space-y-4">
                {/* Event Cover Image */}
                {viewModal.event.cover_image_url && (
                  <div className="relative w-full h-64 rounded-xl overflow-hidden bg-black border border-gray-100 mb-4 flex items-center justify-center">
                    <img
                      src={viewModal.event.cover_image_url.startsWith('http')
                        ? viewModal.event.cover_image_url
                        : `${import.meta.env.VITE_API_URL || 'http://192.168.1.15:8002'}${viewModal.event.cover_image_url}`}
                      alt={viewModal.event.title}
                      className="max-w-full max-h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder-event.jpg';
                      }}
                    />
                  </div>
                )}

                {/* Status Badge */}
                <div className="flex justify-end">
                  {getEventStatusBadge(viewModal.event.status)}
                </div>

                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-400">Title</Label>
                    <p className="text-sm font-bold text-gray-900">
                      {viewModal.event.title}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-400">Event Type</Label>
                    <p className="text-sm text-gray-700">
                      {typeof (viewModal.event as any).event_type === 'object' ? (viewModal.event as any).event_type?.title : ((viewModal.event as any).event_type_title || "-")}
                    </p>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <Label className="text-xs text-gray-400">Description</Label>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-100">
                    {viewModal.event.description || "No description"}
                  </p>
                </div>

                {/* Location & Virtual Status */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-400">Location</Label>
                    <p className="text-sm text-gray-700 flex items-center gap-1">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      {(viewModal.event as any).location_name ||
                        "Not specified"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-400">
                      Virtual Event
                    </Label>
                    <p className="text-sm text-gray-700">
                      {(viewModal.event as any).is_virtual ? "Yes" : "No"}
                    </p>
                  </div>
                </div>

                {/* Date & Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-400">Start Date</Label>
                    <p className="text-sm text-gray-700 flex items-center gap-1">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {(viewModal.event as any).start_date
                        ? format(
                          new Date((viewModal.event as any).start_date),
                          "MMMM d, yyyy"
                        )
                        : "Not set"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-400">Start Time</Label>
                    <p className="text-sm text-gray-700 flex items-center gap-1">
                      <Clock className="w-4 h-4 text-gray-400" />
                      {(viewModal.event as any).start_date
                        ? format(
                          new Date((viewModal.event as any).start_date),
                          "h:mm a"
                        )
                        : "-"}
                    </p>
                  </div>
                </div>

                {/* Created By */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-400">Created By</Label>
                    <p className="text-sm text-gray-700 flex items-center gap-1">
                      <User className="w-4 h-4 text-gray-400" />
                      {typeof (viewModal.event as any).created_by === 'object' ? (viewModal.event as any).created_by?.full_name : ((viewModal.event as any).created_by_name || "Unknown")}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-400">Created At</Label>
                    <p className="text-sm text-gray-700 flex items-center gap-1">
                      <Clock className="w-4 h-4 text-gray-400" />
                      {format(
                        new Date(viewModal.event.created_at),
                        "MMM d, yyyy h:mm a"
                      )}
                    </p>
                  </div>
                </div>

                {/* Visibility */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-400">Visibility</Label>
                    <p className="text-sm text-gray-700">
                      {(viewModal.event as any).visibility_name || "Not set"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-400">Comments</Label>
                    <p className="text-sm text-gray-700">
                      {(viewModal.event as any).comment_count || 0} comments
                    </p>
                  </div>
                </div>

                {/* RSVP Stats - Only shown in modal */}
                <div className="space-y-2">
                  <Label className="text-xs text-gray-400">
                    RSVP Statistics
                  </Label>
                  <div className="flex gap-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-xs">
                        Going: {(viewModal.event as any).rsvp_going || 0}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <span className="text-xs">
                        Maybe: {(viewModal.event as any).rsvp_maybe || 0}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span className="text-xs">
                        Not Going:{" "}
                        {(viewModal.event as any).rsvp_not_going || 0}
                      </span>
                    </div>
                  </div>
                </div>

                {/* View Count */}
                <div className="space-y-1">
                  <Label className="text-xs text-gray-400">Views</Label>
                  <p className="text-sm text-gray-700">
                    {(viewModal.event as any).view_count || 0} views
                  </p>
                </div>
              </div>

              <DialogFooter className="pt-4 border-t border-gray-100">
                <Button
                  variant="outline"
                  className="rounded-xl font-bold"
                  onClick={() => setViewModal({ open: false, event: null })}
                >
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirm Action Dialog */}
      <Dialog
        open={confirmAction.open}
        onOpenChange={(open: boolean) =>
          !open && setConfirmAction({ open: false, eventId: null })
        }
      >
        <DialogContent className="sm:max-w-md bg-red-200">
          <DialogHeader>
            <DialogTitle className="text-lg font-black">
              {confirmAction.action === "approve"
                ? "Approve Event"
                : "Reject Event"}
            </DialogTitle>
            <DialogDescription className=" text-sm text-black-700 mt-2">
              {confirmAction.action === "approve"
                ? "Are you sure you want to approve this event? It will be publicly visible to users based on visibility settings."
                : "Are you sure you want to reject this event? This action can be changed later by editing the event."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setConfirmAction({ open: false, eventId: null })}
            >
              Cancel
            </Button>
            <Button
              className={
                confirmAction.action === "approve"
                  ? "bg-red-600 text-white hover:bg-red-700"
                  : "bg-red-600 text-white hover:bg-red-700"
              }
              onClick={() => {
                if (confirmAction.eventId !== null && confirmAction.action) {
                  handleModerate(confirmAction.eventId, confirmAction.action);
                }
              }}
            >
              {confirmAction.action === "approve" ? "Approve" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Visibility Restriction Dialog */}
      <Dialog
        open={visibilityModal.open}
        onOpenChange={(open: boolean) =>
          !open && setVisibilityModal({ open: false, event: null })
        }
      >
        <DialogContent className="max-w-md bg-white border-none shadow-2xl rounded-3xl overflow-hidden p-0 max-h-[85vh] flex flex-col">
          <DialogHeader className="px-6 py-5 bg-linear-to-r from-purple-50 to-white border-b border-purple-100 shrink-0">
            <DialogTitle className="flex items-center gap-3 text-lg font-black text-gray-900">
              <div className="w-9 h-9 bg-purple-100 rounded-full flex items-center justify-center">
                <EyeOff className="w-4 h-4 text-purple-600" />
              </div>
              Restrict User Visibility
            </DialogTitle>
            <DialogDescription className="text-gray-500 font-medium pl-12 pt-1">
              Select which visibility options this user can use for future
              events.
              {visibilityModal.event && (
                <span className="block mt-1 text-sm">
                  User:{" "}
                  <span className="font-bold text-gray-700">
                    {(visibilityModal.event as any).created_by_name ||
                      (typeof visibilityModal.event.created_by === "object"
                        ? visibilityModal.event.created_by?.username
                        : `User ID: ${visibilityModal.event.created_by}`)}
                  </span>
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="p-6 overflow-y-auto flex-1">
            <div className="space-y-3">
              <Label className="text-sm font-bold text-gray-700 block mb-2">
                Allowed Visibility Options
              </Label>
              {VISIBILITY_CHOICES.map((choice) => (
                <div
                  key={choice.id}
                  className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <Checkbox
                    id={`vis-${choice.id}`}
                    checked={selectedVisibilities.includes(choice.id)}
                    onCheckedChange={(checked: boolean) => {
                      if (checked) {
                        setSelectedVisibilities([
                          ...selectedVisibilities,
                          choice.id,
                        ]);
                      } else {
                        setSelectedVisibilities(
                          selectedVisibilities.filter((id) => id !== choice.id)
                        );
                      }
                    }}
                  />
                  <Label
                    htmlFor={`vis-${choice.id}`}
                    className="text-sm font-medium text-gray-700 cursor-pointer flex-1"
                  >
                    {choice.label}
                  </Label>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-4">
              Note: This will restrict the user to only the selected visibility
              options when creating new events.
            </p>
          </div>

          <DialogFooter className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 gap-2 shrink-0">
            <Button
              variant="outline"
              className="font-bold rounded-xl"
              onClick={() => setVisibilityModal({ open: false, event: null })}
            >
              Cancel
            </Button>
            <Button
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl"
              onClick={handleApplyRestriction}
              disabled={selectedVisibilities.length === 0 || restrictingUser}
            >
              {restrictingUser ? "Applying..." : "Apply Restrictions"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Action Response Dialog */}
      <Dialog
        open={actionResponseModal.open}
        onOpenChange={(open: boolean) =>
          !open &&
          setActionResponseModal({ open: false, message: "", action: "" })
        }
      >
        <DialogContent className="max-w-md bg-white rounded-2xl shadow-2xl border-0">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center ${actionResponseModal.action === "APPROVED"
                    ? "bg-green-100"
                    : actionResponseModal.action === "REJECTED"
                      ? "bg-red-100"
                      : actionResponseModal.action === "RESTRICTED"
                        ? "bg-purple-100"
                        : actionResponseModal.action === "ERROR"
                          ? "bg-red-100"
                          : "bg-red-100"
                  }`}
              >
                {actionResponseModal.action === "APPROVED" && (
                  <Check className="w-6 h-6 text-green-600" />
                )}
                {actionResponseModal.action === "REJECTED" && (
                  <X className="w-6 h-6 text-red-600" />
                )}
                {actionResponseModal.action === "RESTRICTED" && (
                  <EyeOff className="w-6 h-6 text-purple-600" />
                )}
                {actionResponseModal.action === "ERROR" && (
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                )}
                {!["APPROVED", "REJECTED", "RESTRICTED", "ERROR"].includes(
                  actionResponseModal.action
                ) && <Info className="w-6 h-6 text-red-600" />}
              </div>
              <div>
                <DialogTitle className="text-lg font-black text-gray-900">
                  {actionResponseModal.action === "ERROR"
                    ? "Action Failed"
                    : "Action Completed"}
                </DialogTitle>
                <DialogDescription className="text-sm text-gray-500 mt-0.5">
                  Status:{" "}
                  <span
                    className={`font-bold ${actionResponseModal.action === "APPROVED"
                        ? "text-green-600"
                        : actionResponseModal.action === "REJECTED"
                          ? "text-red-600"
                          : actionResponseModal.action === "RESTRICTED"
                            ? "text-purple-600"
                            : actionResponseModal.action === "ERROR"
                              ? "text-red-600"
                              : "text-red-600"
                      }`}
                  >
                    {actionResponseModal.action}
                  </span>
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="py-4">
            <p
              className={`p-4 rounded-xl border ${actionResponseModal.action === "ERROR"
                  ? "bg-red-50 text-red-700 border-red-100"
                  : "bg-gray-50 text-gray-700 border-gray-100"
                }`}
            >
              {actionResponseModal.message}
            </p>
          </div>

          <DialogFooter>
            <Button
              className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-bold"
              onClick={() =>
                setActionResponseModal({ open: false, message: "", action: "" })
              }
            >
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
