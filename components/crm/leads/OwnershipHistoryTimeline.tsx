"use client";

import { formatDistanceToNow } from "date-fns";
import { UserCheck, ShieldAlert, ArrowRight, User, MapPin } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface UserSummary {
  id: string;
  name: string | null;
  email: string;
  avatar: string | null;
}

interface HistoryItem {
  id: string;
  entity_type: string;
  entity_id: string;
  previous_owner_id: string | null;
  new_owner_id: string | null;
  area_director_id: string | null;
  regional_director_id: string | null;
  changed_by_id: string | null;
  change_reason: string | null;
  createdAt: Date | string;
  previous_owner: UserSummary | null;
  new_owner: UserSummary | null;
  area_director: UserSummary | null;
  regional_director: UserSummary | null;
  changed_by_user: UserSummary | null;
}

interface OwnershipHistoryTimelineProps {
  history: HistoryItem[];
}

export function OwnershipHistoryTimeline({ history }: OwnershipHistoryTimelineProps) {
  if (!history || history.length === 0) {
    return (
      <Card className="border border-slate-200/50 dark:border-slate-800/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md">
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <User className="h-8 w-8 text-muted-foreground mb-2 opacity-50" />
          <p className="text-sm font-medium text-muted-foreground">No ownership history records found.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-slate-200/50 dark:border-slate-800/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <UserCheck className="h-5 w-5 text-indigo-500" />
          Ownership & Responsibility Audit Trail
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative border-l border-slate-200 dark:border-slate-800 ml-4 pl-6 space-y-6">
          {history.map((item) => {
            const dateVal = typeof item.createdAt === "string" ? new Date(item.createdAt) : item.createdAt;

            return (
              <div key={item.id} className="relative">
                {/* Timeline Node Icon */}
                <span className="absolute -left-[31px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-500 ring-4 ring-white dark:ring-slate-900">
                  <span className="h-2 w-2 rounded-full bg-white" />
                </span>

                <div className="flex flex-col gap-2 bg-slate-50/50 dark:bg-slate-800/30 p-4 rounded-xl border border-slate-200/40 dark:border-slate-700/20 shadow-sm backdrop-blur-sm transition-all hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  {/* Header info */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                        {dateVal.toLocaleString()}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({formatDistanceToNow(dateVal, { addSuffix: true })})
                      </span>
                    </div>

                    {item.changed_by_user ? (
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                        <span>Changed by:</span>
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={item.changed_by_user.avatar || ""} />
                          <AvatarFallback className="text-[9px]">
                            {item.changed_by_user.name?.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{item.changed_by_user.name || item.changed_by_user.email}</span>
                      </div>
                    ) : (
                      <Badge variant="outline" className="text-[10px] uppercase tracking-wider text-muted-foreground bg-slate-100 dark:bg-slate-800">
                        System Automatic
                      </Badge>
                    )}
                  </div>

                  {/* Transfer Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1.5">
                    {/* Owner Change */}
                    <div className="flex items-center gap-2 bg-white/60 dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                      <div className="flex-1">
                        <span className="text-[10px] text-muted-foreground uppercase font-bold block mb-1">
                          Previous Assignee
                        </span>
                        <div className="flex items-center gap-1.5">
                          {item.previous_owner ? (
                            <>
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={item.previous_owner.avatar || ""} />
                                <AvatarFallback className="text-[10px]">
                                  {item.previous_owner.name?.charAt(0) || "U"}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                {item.previous_owner.name || item.previous_owner.email}
                              </span>
                            </>
                          ) : (
                            <span className="text-xs text-slate-400 dark:text-slate-500 italic">Unassigned</span>
                          )}
                        </div>
                      </div>

                      <ArrowRight className="h-4 w-4 text-slate-400" />

                      <div className="flex-1 pl-1">
                        <span className="text-[10px] text-muted-foreground uppercase font-bold block mb-1">
                          New Assignee
                        </span>
                        <div className="flex items-center gap-1.5">
                          {item.new_owner ? (
                            <>
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={item.new_owner.avatar || ""} />
                                <AvatarFallback className="text-[10px]">
                                  {item.new_owner.name?.charAt(0) || "U"}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                                {item.new_owner.name || item.new_owner.email}
                              </span>
                            </>
                          ) : (
                            <span className="text-xs text-slate-400 dark:text-slate-500 italic">Unassigned</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Regional Responsibility */}
                    <div className="flex flex-col justify-center bg-white/60 dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 text-xs gap-1.5">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-indigo-400" />
                        <span className="text-slate-500">Area Director:</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {item.area_director?.name || item.area_director?.email || "None"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-pink-400" />
                        <span className="text-slate-500">Regional Director:</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {item.regional_director?.name || item.regional_director?.email || "None"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Change Reason */}
                  {item.change_reason && (
                    <div className="mt-2 text-xs bg-indigo-50/20 dark:bg-indigo-950/10 border border-indigo-100/30 dark:border-indigo-900/20 p-2.5 rounded-lg">
                      <div className="flex items-start gap-1.5">
                        <ShieldAlert className="h-3.5 w-3.5 text-indigo-500 mt-0.5" />
                        <div>
                          <span className="font-semibold text-slate-500 block mb-0.5">Reason for transfer:</span>
                          <span className="text-slate-700 dark:text-slate-300 leading-relaxed font-mono">
                            {item.change_reason}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
