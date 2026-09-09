"use client";

import { ChevronDown } from "lucide-react";

import { ServerPill, type SourceStatus } from "@/components/ui/ServerPill";
import type { LiveChannelSource, LiveStreamSourceGroup } from "@/lib/iptv/types";
import { cn } from "@/lib/utils";

function aggregateGroupStatus(
  streams: LiveStreamSourceGroup["streams"],
  sourceStatuses: SourceStatus[],
): SourceStatus {
  const statuses = streams.map((stream) => sourceStatuses[stream.index] ?? "pending");

  if (statuses.some((status) => status === "connected")) return "connected";
  if (statuses.some((status) => status === "loading")) return "loading";
  if (statuses.length > 0 && statuses.every((status) => status === "failed")) return "failed";
  return "pending";
}

interface StreamSourcePickerProps {
  groups: LiveStreamSourceGroup[];
  sourceStatuses: SourceStatus[];
  expandedSource: LiveChannelSource | null;
  interactive: boolean;
  onExpand: (source: LiveChannelSource | null) => void;
  onSelect: (index: number) => void;
}

export function StreamSourcePicker({
  groups,
  sourceStatuses,
  expandedSource,
  interactive,
  onExpand,
  onSelect,
}: StreamSourcePickerProps) {
  if (groups.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {groups.map((group) => {
          const groupStatus = aggregateGroupStatus(group.streams, sourceStatuses);
          const isExpanded = expandedSource === group.source;
          const hasMultiple = group.streams.length > 1;

          return (
            <button
              key={group.source}
              type="button"
              disabled={!interactive && groupStatus !== "loading"}
              onClick={() => {
                if (hasMultiple) {
                  onExpand(isExpanded ? null : group.source);
                  return;
                }

                if (interactive) {
                  onSelect(group.streams[0]!.index);
                }
              }}
              className={cn(
                "flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-all duration-300",
                groupStatus === "pending" && "border-white/10 bg-white/[0.04] text-zinc-400",
                groupStatus === "loading" &&
                  "border-gold-500/50 bg-gold-500/10 text-gold-400 shadow-[0_0_20px_rgba(212,160,23,0.15)]",
                groupStatus === "failed" && "border-red-500/20 bg-red-500/5 text-red-400/80",
                groupStatus === "connected" &&
                  "border-gold-500/40 bg-gold-500/15 text-gold-300 shadow-[0_0_16px_rgba(212,160,23,0.2)]",
                interactive &&
                  groupStatus !== "loading" &&
                  "cursor-pointer hover:border-gold-500/40 hover:bg-gold-500/10 hover:text-gold-300",
              )}
            >
              {groupStatus === "loading" && (
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold-400 opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-gold-500" />
                </span>
              )}
              <span>{group.label}</span>
              {hasMultiple && (
                <ChevronDown
                  size={14}
                  className={cn("opacity-70 transition-transform", isExpanded && "rotate-180")}
                />
              )}
            </button>
          );
        })}
      </div>

      {groups.map((group) => {
        if (group.streams.length <= 1 || expandedSource !== group.source) return null;

        return (
          <div key={`${group.source}-streams`} className="flex flex-wrap gap-2 pl-1">
            {group.streams.map((stream, slot) => (
              <ServerPill
                key={stream.index}
                index={slot}
                label={stream.label}
                status={sourceStatuses[stream.index] ?? "pending"}
                interactive={interactive}
                onSelect={interactive ? () => onSelect(stream.index) : undefined}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
}
