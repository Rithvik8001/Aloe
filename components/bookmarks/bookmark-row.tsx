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
import { MoreHorizontal, ExternalLink, Trash2, FileText } from "lucide-react";
import { toast } from "sonner";
import { format, isThisYear } from "date-fns";

interface Bookmark {
  id: string;
  url?: string | null;
  title: string;
  desc?: string | null;
  favicon?: string | null;
  type: string;
  createdAt: Date;
}

interface BookmarkRowProps {
  bookmark: Bookmark;
  onDelete?: (id: string) => void;
}

export function BookmarkRow({ bookmark, onDelete }: BookmarkRowProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const formatDate = (date: Date) => {
    const bookmarkDate = new Date(date);

    if (isThisYear(bookmarkDate)) {
      return format(bookmarkDate, "MMM d");
    }

    return format(bookmarkDate, "MMM d, yyyy");
  };

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/bookmarks/${bookmark.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete bookmark");
      }

      toast.success("Bookmark deleted");
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

  return (
    <>
      <div className="group flex items-center gap-4 py-2 px-4 hover:bg-accent/50 transition-colors rounded-lg">
        {/* Favicon or icon */}
        <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
          {bookmark.type === "link" && bookmark.favicon ? (
            <img
              src={bookmark.favicon}
              alt=""
              className="w-5 h-5 rounded"
              onError={(e) => {
                e.currentTarget.style.display = "none";
                const parent = e.currentTarget.parentElement;
                if (parent) {
                  parent.innerHTML =
                    '<div class="w-4 h-4 rounded-full bg-muted flex items-center justify-center"><div class="w-2 h-2 rounded-full bg-foreground/20"></div></div>';
                }
              }}
            />
          ) : bookmark.type === "plain_text" ? (
            <FileText className="w-4 h-4 text-muted-foreground" />
          ) : (
            <div className="w-4 h-4 rounded-full bg-muted flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-foreground/20"></div>
            </div>
          )}
        </div>

        {/* Content */}
        <div
          className="flex-1 min-w-0 cursor-pointer"
          onClick={bookmark.type === "link" ? handleOpenUrl : undefined}
        >
          <div className="flex items-baseline gap-2">
            <h3 className="font-medium text-sm truncate hover:underline">
              {bookmark.title}
            </h3>
          </div>
          {bookmark.url && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {bookmark.url}
            </p>
          )}
        </div>

        {/* Created date */}
        <div className="flex-shrink-0 flex items-center gap-3">
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {formatDate(bookmark.createdAt)}
          </span>

          {/* Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {bookmark.url && (
                <DropdownMenuItem onClick={handleOpenUrl}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open
                </DropdownMenuItem>
              )}
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
            <AlertDialogTitle>Delete bookmark?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &quot;{bookmark.title}&quot;. This
              action cannot be undone.
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
