"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  MapPin,
  Users,
  Bell,
  Trash2,
  Edit,
  CheckCircle2,
  FileText,
  Video,
  ExternalLink,
} from "lucide-react";
import {
  format,
  addDays,
  subDays,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  parseISO,
} from "date-fns";
import {
  getCalendarEvents,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  type UnifiedCalendarEvent,
} from "@/actions/calendar/calendar";

type CalendarViewMode = "day" | "week" | "month";

export function CalendarClient() {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<CalendarViewMode>("week");
  const [events, setEvents] = useState<UnifiedCalendarEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [showAppointments, setShowAppointments] = useState(true);
  const [showMeetings, setShowMeetings] = useState(true);
  const [showTasks, setShowTasks] = useState(true);

  // Create / Edit Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [selectedEventDetails, setSelectedEventDetails] = useState<UnifiedCalendarEvent | null>(null);

  // Form Fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [startDateStr, setStartDateStr] = useState(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
  const [endDateStr, setEndDateStr] = useState(
    format(new Date(Date.now() + 60 * 60 * 1000), "yyyy-MM-dd'T'HH:mm")
  );
  const [isAllDay, setIsAllDay] = useState(false);
  const [attendeesStr, setAttendeesStr] = useState("");
  const [reminderMin, setReminderMin] = useState(15);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, [currentDate, viewMode]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      let rangeStart: Date;
      let rangeEnd: Date;

      if (viewMode === "day") {
        rangeStart = subDays(currentDate, 1);
        rangeEnd = addDays(currentDate, 1);
      } else if (viewMode === "week") {
        rangeStart = startOfWeek(currentDate, { weekStartsOn: 1 });
        rangeEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
      } else {
        rangeStart = startOfMonth(currentDate);
        rangeEnd = endOfMonth(currentDate);
      }

      const fetched = await getCalendarEvents(rangeStart.toISOString(), rangeEnd.toISOString());
      setEvents(fetched);
    } catch (err) {
      // A deploy since this tab was opened invalidates the server action ID
      // baked into the loaded bundle — silently failing here just looks like
      // an empty diary, so surface it instead of swallowing it.
      const message = err instanceof Error ? err.message : "";
      if (message.includes("Failed to find Server Action")) {
        toast.error("This page is out of date — please refresh to see your diary.");
      } else {
        toast.error("Failed to load your diary. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePrev = () => {
    if (viewMode === "day") setCurrentDate(subDays(currentDate, 1));
    else if (viewMode === "week") setCurrentDate(subWeeks(currentDate, 1));
    else setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNext = () => {
    if (viewMode === "day") setCurrentDate(addDays(currentDate, 1));
    else if (viewMode === "week") setCurrentDate(addWeeks(currentDate, 1));
    else setCurrentDate(addMonths(currentDate, 1));
  };

  const openCreateModal = (presetDate?: Date) => {
    const base = presetDate || currentDate;
    setEditingEventId(null);
    setTitle("");
    setDescription("");
    setLocation("");
    setStartDateStr(format(base, "yyyy-MM-dd'T'09:00"));
    setEndDateStr(format(base, "yyyy-MM-dd'T me:10:00'".replace("me:10", "10")));
    setIsAllDay(false);
    setAttendeesStr("");
    setReminderMin(15);
    setNotes("");
    setIsCreateOpen(true);
  };

  const openEditModal = (evt: UnifiedCalendarEvent) => {
    if (evt.type !== "appointment") {
      setSelectedEventDetails(evt);
      return;
    }
    setEditingEventId(evt.id);
    setTitle(evt.title);
    setDescription(evt.description || "");
    setLocation(evt.location || "");
    setStartDateStr(format(parseISO(evt.startTime), "yyyy-MM-dd'T'HH:mm"));
    setEndDateStr(format(parseISO(evt.endTime), "yyyy-MM-dd'T'HH:mm"));
    setIsAllDay(evt.isAllDay);
    setAttendeesStr(evt.attendees ? evt.attendees.join(", ") : "");
    setReminderMin(evt.reminderMin || 15);
    setNotes(evt.notes || "");
    setIsCreateOpen(true);
  };

  const handleSave = async () => {
    if (!title.trim()) return;
    setSubmitting(true);
    try {
      const attendees = attendeesStr
        .split(",")
        .map((e) => e.trim())
        .filter(Boolean);

      if (editingEventId) {
        await updateAppointment(editingEventId, {
          title,
          description,
          location,
          startTime: startDateStr,
          endTime: endDateStr,
          isAllDay,
          attendees,
          reminderMin,
          notes,
        });
      } else {
        await createAppointment({
          title,
          description,
          location,
          startTime: startDateStr,
          endTime: endDateStr,
          isAllDay,
          attendees,
          reminderMin,
          notes,
        });
      }
      setIsCreateOpen(false);
      fetchEvents();
    } catch {
      // Error
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this appointment?")) return;
    try {
      await deleteAppointment(id);
      setSelectedEventDetails(null);
      fetchEvents();
    } catch {
      // Error
    }
  };

  const filteredEvents = events.filter((e) => {
    if (e.type === "appointment" && !showAppointments) return false;
    if (e.type === "meeting" && !showMeetings) return false;
    if (e.type === "task" && !showTasks) return false;
    return true;
  });

  // Calculate days for Week or Month view
  const weekDays = eachDayOfInterval({
    start: startOfWeek(currentDate, { weekStartsOn: 1 }),
    end: endOfWeek(currentDate, { weekStartsOn: 1 }),
  });

  const monthStart = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 });
  const monthEnd = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 });
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  return (
    <div className="space-y-4 p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <CalendarIcon className="h-6 w-6 text-primary" />
            Staff Business Calendar & Diary
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage your daily appointments, CRM meetings, and assigned tasks in one diary.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Navigation Controls */}
          <div className="flex items-center rounded-md border bg-background shadow-sm">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handlePrev}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-3 text-xs font-semibold"
              onClick={() => setCurrentDate(new Date())}
            >
              Today
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <span className="text-sm font-semibold min-w-[130px] text-center">
            {viewMode === "day"
              ? format(currentDate, "EEEE, MMMM d, yyyy")
              : viewMode === "week"
              ? `Week of ${format(weekDays[0], "MMM d")} - ${format(weekDays[6], "MMM d, yyyy")}`
              : format(currentDate, "MMMM yyyy")}
          </span>

          {/* View Mode Selector */}
          <div className="flex items-center rounded-md border bg-muted p-0.5">
            <Button
              variant={viewMode === "day" ? "default" : "ghost"}
              size="sm"
              className="h-7 text-xs px-2.5"
              onClick={() => setViewMode("day")}
            >
              Day
            </Button>
            <Button
              variant={viewMode === "week" ? "default" : "ghost"}
              size="sm"
              className="h-7 text-xs px-2.5"
              onClick={() => setViewMode("week")}
            >
              Week
            </Button>
            <Button
              variant={viewMode === "month" ? "default" : "ghost"}
              size="sm"
              className="h-7 text-xs px-2.5"
              onClick={() => setViewMode("month")}
            >
              Month
            </Button>
          </div>

          <Button size="sm" className="gap-1.5 ml-auto md:ml-0" onClick={() => openCreateModal()}>
            <Plus className="h-4 w-4" /> New Appointment
          </Button>
        </div>
      </div>

      {/* Filter Toggles */}
      <div className="flex items-center gap-4 text-xs font-medium bg-muted/40 p-2.5 rounded-lg border">
        <span className="text-muted-foreground font-semibold">Filter Diary:</span>
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={showAppointments}
            onChange={(e) => setShowAppointments(e.target.checked)}
            className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
          />
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-purple-600" />
          <span>Appointments</span>
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={showMeetings}
            onChange={(e) => setShowMeetings(e.target.checked)}
            className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
          />
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-600" />
          <span>CRM Meetings & Calls</span>
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={showTasks}
            onChange={(e) => setShowTasks(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-600" />
          <span>Assigned Tasks</span>
        </label>
      </div>

      {/* Calendar Grid Views */}
      {viewMode === "day" && (
        <div className="border rounded-lg bg-background p-4 space-y-3">
          <h2 className="text-lg font-bold border-b pb-2">
            {format(currentDate, "EEEE, MMMM d, yyyy")}
          </h2>
          {filteredEvents.filter((e) => isSameDay(parseISO(e.startTime), currentDate)).length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No appointments, meetings, or tasks scheduled for this day.
            </p>
          ) : (
            <div className="space-y-2">
              {filteredEvents
                .filter((e) => isSameDay(parseISO(e.startTime), currentDate))
                .map((evt) => (
                  <Card
                    key={evt.id}
                    className={`cursor-pointer transition-all hover:shadow-md border-l-4 ${
                      evt.type === "appointment"
                        ? "border-l-purple-600 bg-purple-50/50 dark:bg-purple-950/20"
                        : evt.type === "meeting"
                        ? "border-l-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20"
                        : "border-l-blue-600 bg-blue-50/50 dark:bg-blue-950/20"
                    }`}
                    onClick={() => (evt.type === "appointment" ? openEditModal(evt) : setSelectedEventDetails(evt))}
                  >
                    <CardContent className="p-3 flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-sm">{evt.title}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                          <Clock className="h-3 w-3" />
                          {evt.isAllDay
                            ? "All Day"
                            : `${format(parseISO(evt.startTime), "h:mm a")} - ${format(
                                parseISO(evt.endTime),
                                "h:mm a"
                              )}`}
                          {evt.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" /> {evt.location}
                            </span>
                          )}
                        </p>
                      </div>
                      <Badge variant="outline" className="capitalize text-xs">
                        {evt.type}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </div>
      )}

      {viewMode === "week" && (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
          {weekDays.map((day) => {
            const dayEvents = filteredEvents.filter((e) => isSameDay(parseISO(e.startTime), day));
            const isToday = isSameDay(day, new Date());
            return (
              <div
                key={day.toISOString()}
                className={`border rounded-lg p-2 min-h-[280px] bg-background flex flex-col ${
                  isToday ? "ring-2 ring-primary bg-primary/5" : ""
                }`}
              >
                <div className="flex items-center justify-between border-b pb-1.5 mb-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase">
                    {format(day, "EEE")}
                  </span>
                  <span
                    className={`text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center ${
                      isToday ? "bg-primary text-primary-foreground" : ""
                    }`}
                  >
                    {format(day, "d")}
                  </span>
                </div>

                <div className="space-y-1.5 flex-1 overflow-y-auto max-h-[300px]">
                  {dayEvents.map((evt) => (
                    <div
                      key={evt.id}
                      onClick={() => (evt.type === "appointment" ? openEditModal(evt) : setSelectedEventDetails(evt))}
                      className={`p-1.5 rounded border text-xs cursor-pointer transition-all hover:opacity-90 ${
                        evt.type === "appointment"
                          ? "bg-purple-600 text-white border-purple-700"
                          : evt.type === "meeting"
                          ? "bg-emerald-600 text-white border-emerald-700"
                          : "bg-blue-600 text-white border-blue-700"
                      }`}
                    >
                      <p className="font-semibold truncate">{evt.title}</p>
                      <p className="text-[10px] opacity-90">
                        {evt.isAllDay ? "All Day" : format(parseISO(evt.startTime), "h:mm a")}
                      </p>
                    </div>
                  ))}
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-[11px] h-6 text-muted-foreground hover:text-foreground mt-1"
                  onClick={() => openCreateModal(day)}
                >
                  + Add
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {viewMode === "month" && (
        <div className="border rounded-lg bg-background overflow-hidden">
          <div className="grid grid-cols-7 border-b bg-muted/40 text-center text-xs font-semibold py-2">
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
            <div>Sun</div>
          </div>
          <div className="grid grid-cols-7 divide-x divide-y border-b">
            {monthDays.map((day) => {
              const dayEvents = filteredEvents.filter((e) => isSameDay(parseISO(e.startTime), day));
              const inCurrentMonth = isSameMonth(day, currentDate);
              const isToday = isSameDay(day, new Date());
              return (
                <div
                  key={day.toISOString()}
                  className={`min-h-[90px] p-1 ${
                    inCurrentMonth ? "bg-background" : "bg-muted/30 text-muted-foreground"
                  } ${isToday ? "bg-primary/5" : ""}`}
                >
                  <div className="flex items-center justify-between text-[11px] font-semibold mb-1">
                    <span className={isToday ? "rounded-full bg-primary text-primary-foreground px-1.5" : ""}>
                      {format(day, "d")}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {dayEvents.slice(0, 3).map((evt) => (
                      <div
                        key={evt.id}
                        onClick={() => (evt.type === "appointment" ? openEditModal(evt) : setSelectedEventDetails(evt))}
                        className={`truncate text-[10px] px-1 py-0.5 rounded cursor-pointer ${
                          evt.type === "appointment"
                            ? "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200"
                            : evt.type === "meeting"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
                            : "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200"
                        }`}
                      >
                        {evt.title}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <span className="text-[9px] text-muted-foreground px-1">
                        +{dayEvents.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Create / Edit Appointment Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingEventId ? "Edit Appointment" : "Create New Appointment"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-1 text-xs">
            <div className="space-y-1">
              <Label>Title *</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Meeting / Appointment Title"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>Start Time *</Label>
                <Input
                  type="datetime-local"
                  value={startDateStr}
                  onChange={(e) => setStartDateStr(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>End Time *</Label>
                <Input
                  type="datetime-local"
                  value={endDateStr}
                  onChange={(e) => setEndDateStr(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center justify-between py-1">
              <Label htmlFor="allday" className="cursor-pointer">
                All-Day Event
              </Label>
              <Switch id="allday" checked={isAllDay} onCheckedChange={setIsAllDay} />
            </div>

            <div className="space-y-1">
              <Label className="flex items-center gap-1">
                <MapPin className="h-3 w-3" /> Location
              </Label>
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Office Room 2, Zoom URL, or Address"
              />
            </div>

            <div className="space-y-1">
              <Label className="flex items-center gap-1">
                <Users className="h-3 w-3" /> Attendees (Email invitations will be sent)
              </Label>
              <Input
                value={attendeesStr}
                onChange={(e) => setAttendeesStr(e.target.value)}
                placeholder="colleague@ukrba.org, client@company.com"
              />
            </div>

            <div className="space-y-1">
              <Label className="flex items-center gap-1">
                <Bell className="h-3 w-3" /> Meeting Reminder
              </Label>
              <select
                value={reminderMin}
                onChange={(e) => setReminderMin(Number(e.target.value))}
                className="w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-xs shadow-sm"
              >
                <option value={5}>5 minutes before</option>
                <option value={15}>15 minutes before</option>
                <option value={30}>30 minutes before</option>
                <option value={60}>1 hour before</option>
                <option value={1440}>1 day before</option>
              </select>
            </div>

            <div className="space-y-1">
              <Label className="flex items-center gap-1">
                <FileText className="h-3 w-3" /> Appointment Notes
              </Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Agenda, preparation notes, or meeting minutes..."
              />
            </div>
          </div>

          <DialogFooter className="flex items-center justify-between">
            {editingEventId && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDelete(editingEventId)}
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
              </Button>
            )}
            <div className="flex gap-2 ml-auto">
              <Button variant="outline" size="sm" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={submitting}>
                {submitting ? "Saving..." : "Save Appointment"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Read-Only Details Modal for Non-appointment Items (CRM Meetings & Tasks) */}
      {selectedEventDetails && (
        <Dialog open={!!selectedEventDetails} onOpenChange={() => setSelectedEventDetails(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Badge className="capitalize">{selectedEventDetails.type}</Badge>
                {selectedEventDetails.title}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3 py-2 text-xs">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-3.5 w-3.5 text-primary" />
                <span>
                  {format(parseISO(selectedEventDetails.startTime), "PPpp")}
                </span>
              </div>

              {selectedEventDetails.location && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 text-primary" />
                  <span>{selectedEventDetails.location}</span>
                </div>
              )}

              {selectedEventDetails.description && (
                <div className="space-y-1">
                  <Label>Description</Label>
                  <p className="p-2.5 rounded bg-muted/40 text-muted-foreground whitespace-pre-wrap">
                    {selectedEventDetails.description}
                  </p>
                </div>
              )}

              {/* Join Meeting Button */}
              {selectedEventDetails.meetingUrl && (
                <div className="pt-3 border-t mt-3">
                  <a
                    href={selectedEventDetails.meetingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-700 px-4 py-2.5 text-xs font-bold text-white shadow-md transition-all hover:scale-[1.01]"
                  >
                    <Video className="h-4 w-4" />
                    <span>Join Meeting</span>
                    <ExternalLink className="h-3.5 w-3.5 opacity-80" />
                  </a>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
