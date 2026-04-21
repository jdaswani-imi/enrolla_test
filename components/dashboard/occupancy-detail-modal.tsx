"use client";

import { DoorOpen, Briefcase, Layout, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { roomOccupancyDetail, type RoomDetail } from "@/lib/mock-data";

interface OccupancyDetailModalProps {
  day: string | null;
  time: string | null;
  open: boolean;
  onClose: () => void;
}

const ROOM_ICONS: Record<RoomDetail["type"], React.ElementType> = {
  classroom:    DoorOpen,
  office:       Briefcase,
  "open-space": Layout,
};

const TYPE_LABEL: Record<RoomDetail["type"], string> = {
  classroom:    "Classroom",
  office:       "Office",
  "open-space": "Open Space",
};

function CapacityBar({ occupied, total }: { occupied: number; total: number }) {
  const pct = total > 0 ? Math.round((occupied / total) * 100) : 0;
  const barColor =
    pct >= 85 ? "bg-red-400"
    : pct >= 60 ? "bg-amber-400"
    : "bg-amber-300";

  return (
    <div>
      <div className="flex justify-between text-xs text-slate-500 mb-1">
        <span>{occupied} / {total} seats</span>
        <span className="font-medium">{pct}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-500", barColor)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function OccupancyDetailModal({ day, time, open, onClose }: OccupancyDetailModalProps) {
  const key    = day && time ? `${day}|${time}` : null;
  const detail = key ? roomOccupancyDetail.get(key) : null;
  const title  = detail ? `${detail.day} · ${detail.timeSlot}` : "";

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-md w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base">{title || "Room Breakdown"}</DialogTitle>
        </DialogHeader>

        <div className="p-4 space-y-3">
          {detail ? (
            detail.rooms.map((room) => {
              const Icon = ROOM_ICONS[room.type];
              return (
                <div key={room.name} className="rounded-lg border border-slate-200 bg-white p-3 space-y-2.5">
                  {/* Room header */}
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="text-sm font-semibold text-slate-800">{room.name}</span>
                    <span className="ml-auto text-[11px] text-slate-400 bg-slate-100 rounded px-1.5 py-0.5">
                      {TYPE_LABEL[room.type]}
                    </span>
                  </div>

                  {/* Capacity bar */}
                  <CapacityBar occupied={room.occupiedSeats} total={room.totalSeats} />

                  {/* Sessions list */}
                  {room.sessions.length > 0 ? (
                    <div className="space-y-1.5 pt-0.5">
                      {room.sessions.map((s, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-1.5 text-xs text-slate-600"
                        >
                          <span className="font-medium text-slate-700 truncate">{s.subject}</span>
                          <span className="text-slate-300">·</span>
                          <span className="text-slate-500 truncate">{s.teacher}</span>
                          <span className="ml-auto flex items-center gap-1 text-slate-400 shrink-0">
                            <Users className="w-3 h-3" />
                            {s.students}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">Available</p>
                  )}
                </div>
              );
            })
          ) : (
            <p className="text-sm text-slate-400">No data for this slot.</p>
          )}
        </div>

        <DialogFooter>
          <p className="text-xs text-slate-400">Tap any session to view in Timetable</p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
