"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import {
  MoreVertical,
  ExternalLink,
  Edit,
  Trash2,
  Link as LinkIcon,
  FileText,
  Palette,
} from "lucide-react";
import { toast } from "sonner";

interface Bookmark {
  id: string;
  url?: string | null;
  title: string;
  desc?: string | null;
  favicon?: string | null;
  type: string;
  createdAt: Date;
}

interface BookmarkCardProps {
  bookmark: Bookmark;
  onEdit?: (bookmark: Bookmark) => void;
  onDelete?: (id: string) => void;
}

export function BookmarkCard({
  bookmark,
  onEdit,
  onDelete,
}: BookmarkCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/bookmarks/${bookmark.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete bookmark");
      }

      toast.success("Bookmark deleted successfully");
      onDelete?.(bookmark.id);
      setShowDeleteDialog(false);
    } catch (error) {
      console.error("Error deleting bookmark:", error);
      toast.error("Failed to delete bookmark");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenUrl = () => {
    if (bookmark.url) {
      window.open(bookmark.url, "_blank", "noopener,noreferrer");
    }
  };

  const getTypeIcon = () => {
    switch (bookmark.type) {
      case "link":
        return <LinkIcon className="h-4 w-4" />;
      case "plain_text":
        return <FileText className="h-4 w-4" />;
      case "color":
        return <Palette className="h-4 w-4" />;
      default:
        return <LinkIcon className="h-4 w-4" />;
    }
  };

  const getTypeBadgeVariant = () => {
    switch (bookmark.type) {
      case "link":
        return "default";
      case "plain_text":
        return "secondary";
      case "color":
        return "outline";
      default:
        return "default";
    }
  };

  return (
    <>
      <div className="group relative rounded-lg border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
        {/* Header with favicon/icon and actions */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {/* Favicon or type icon */}
            <div className="mt-1 flex-shrink-0">
              {bookmark.type === "link" && bookmark.favicon ? (
                <img
                  src={bookmark.favicon}
                  alt=""
                  className="h-5 w-5 rounded"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    e.currentTarget.parentElement!.innerHTML =
                      '<div class="h-5 w-5 rounded bg-muted flex items-center justify-center"><svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg></div>';
                  }}
                />
              ) : (
                <div className="h-5 w-5 rounded bg-muted flex items-center justify-center">
                  {getTypeIcon()}
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3
                  className="font-medium text-sm truncate cursor-pointer hover:underline"
                  onClick={bookmark.type === "link" ? handleOpenUrl : undefined}
                  title={bookmark.title}
                >
                  {bookmark.title}
                </h3>
                <Badge variant={getTypeBadgeVariant()} className="text-xs">
                  {bookmark.type}
                </Badge>
              </div>

              {bookmark.url && (
                <p className="text-xs text-muted-foreground truncate mb-2">
                  {bookmark.url}
                </p>
              )}

              {bookmark.desc && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {bookmark.desc}
                </p>
              )}

              <p className="text-xs text-muted-foreground mt-2">
                {new Date(bookmark.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Actions dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {bookmark.url && (
                <DropdownMenuItem onClick={handleOpenUrl}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open in new tab
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => onEdit?.(bookmark)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setShowDeleteDialog(true)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the bookmark &quot;{bookmark.title}
              &quot;. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
