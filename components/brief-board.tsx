"use client";

import { Brief } from "@/lib/db/schema";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useOptimistic, useState, startTransition } from "react";
import { updateBriefStatus } from "@/app/(admin-panel)/admin/actions";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  Loader2,
  Clock,
  CheckCircle,
  XCircle,
  Archive,
  ExternalLink,
  Globe,
  Instagram,
  Twitter,
  Facebook,
  Linkedin,
  Youtube,
  TrendingUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

type BriefWithPendingStatus = Brief & { isPending?: boolean };

export function BriefBoard({ briefs }: { briefs: Brief[] }) {
  const [optimisticBriefs, updateOptimisticBriefs] = useOptimistic(
    briefs,
    (state, { id, status }: { id: string; status: Brief["status"] }) => {
      return state.map((brief) => {
        if (brief.id === id) {
          return { ...brief, status, isPending: true };
        }
        return brief;
      });
    }
  );

  const statusColumns = [
    "pending",
    "approved",
    "rejected",
    "archived",
  ] as const;

  const statusIcons = {
    pending: <Clock className="h-5 w-5 text-amber-500" />,
    approved: <CheckCircle className="h-5 w-5 text-green-500" />,
    rejected: <XCircle className="h-5 w-5 text-red-500" />,
    archived: <Archive className="h-5 w-5 text-slate-500" />,
  };

  const handleDragStart = (e: React.DragEvent, brief: Brief) => {
    e.dataTransfer.setData("briefId", brief.id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, status: Brief["status"]) => {
    e.preventDefault();
    const briefId = e.dataTransfer.getData("briefId");

    // Wrap the optimistic update in startTransition
    startTransition(() => {
      updateOptimisticBriefs({ id: briefId, status });
    });

    // Update the server
    await updateBriefStatus(briefId, status);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {statusColumns.map((status) => (
        <div
          key={status}
          className="bg-card rounded-lg border shadow-sm overflow-hidden"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, status)}
        >
          <div className="p-4 border-b bg-muted/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {statusIcons[status]}
              <h2 className="font-semibold capitalize">{status}</h2>
            </div>
            <Badge variant="outline">
              {
                optimisticBriefs.filter((brief) => brief.status === status)
                  .length
              }
            </Badge>
          </div>
          <div className="p-4 space-y-4 max-h-[calc(100vh-250px)] overflow-y-auto">
            {optimisticBriefs
              .filter((brief) => brief.status === status)
              .map((brief) => (
                <BriefCard
                  key={brief.id}
                  brief={brief}
                  onDragStart={handleDragStart}
                />
              ))}
            {optimisticBriefs.filter((brief) => brief.status === status)
              .length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p>No briefs in this column</p>
                <p className="text-sm mt-1">Drag and drop briefs here</p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function getSocialIcon(platform: string) {
  const icons: Record<string, JSX.Element> = {
    instagram: <Instagram className="h-4 w-4" />,
    twitter: <Twitter className="h-4 w-4" />,
    facebook: <Facebook className="h-4 w-4" />,
    linkedin: <Linkedin className="h-4 w-4" />,
    youtube: <Youtube className="h-4 w-4" />,
    tiktok: <TrendingUp className="h-4 w-4" />,
  };

  const lowercasePlatform = platform.toLowerCase();

  for (const [key, icon] of Object.entries(icons)) {
    if (lowercasePlatform.includes(key)) {
      return icon;
    }
  }

  return <Globe className="h-4 w-4" />;
}

function BriefCard({
  brief,
  onDragStart,
}: {
  brief: BriefWithPendingStatus;
  onDragStart: (e: React.DragEvent, brief: Brief) => void;
}) {
  return (
    <Card
      draggable
      onDragStart={(e) => onDragStart(e, brief)}
      className="cursor-move relative hover:shadow-md transition-shadow border-2 border-transparent hover:border-primary/10"
    >
      {brief.isPending && (
        <div className="absolute top-2 right-2 z-10">
          <Loader2 className="h-5 w-5 text-orange-500 animate-spin" />
        </div>
      )}
      <CardHeader className="pb-2">
        <Link href={`/chat/${brief.id}`}>
          <CardTitle className="text-lg hover:text-primary transition-colors group flex items-center gap-1">
            {brief.name}
            <ExternalLink className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
          </CardTitle>
        </Link>
      </CardHeader>
      <CardContent className="pb-2">
        {brief.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
            {brief.description}
          </p>
        )}
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>
            {formatDistanceToNow(new Date(brief.createdAt), {
              addSuffix: true,
            })}
          </span>
        </div>
        {brief.website && (
          <div className="flex items-center gap-1 text-xs mt-2">
            <Globe className="h-3 w-3 text-blue-500" />
            <a
              href={brief.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline truncate max-w-[200px]"
              onClick={(e) => e.stopPropagation()}
            >
              {brief.website.replace(/^https?:\/\/(www\.)?/, "")}
            </a>
          </div>
        )}
      </CardContent>
      {brief.socialMediaPlan && brief.socialMediaPlan.length > 0 && (
        <CardFooter className="pt-0">
          <div className="flex flex-wrap gap-2">
            {brief.socialMediaPlan.map((platform, index) => (
              <a
                key={index}
                href={platform.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded bg-secondary hover:bg-secondary/80 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                {getSocialIcon(platform.platform)}
                <span>{platform.platform}</span>
              </a>
            ))}
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
