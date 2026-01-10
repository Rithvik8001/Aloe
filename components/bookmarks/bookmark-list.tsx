"use client";

import { useState } from "react";
import { BookmarkCard } from "./bookmark-card";
import { BookmarkForm } from "./bookmark-form";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Plus, Bookmark as BookmarkIcon } from "lucide-react";

interface Bookmark {
  id: string;
  url?: string | null;
  title: string;
  desc?: string | null;
  favicon?: string | null;
  type: string;
  createdAt: Date;
}

interface BookmarkListProps {
  initialBookmarks: Bookmark[];
}

export function BookmarkList({ initialBookmarks }: BookmarkListProps) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(initialBookmarks);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);

  const handleBookmarkAdded = () => {
    setShowAddDialog(false);
    // Refresh bookmarks list
    refreshBookmarks();
  };

  const handleBookmarkUpdated = () => {
    setShowEditDialog(false);
    setEditingBookmark(null);
    // Refresh bookmarks list
    refreshBookmarks();
  };

  const handleEdit = (bookmark: Bookmark) => {
    setEditingBookmark(bookmark);
    setShowEditDialog(true);
  };

  const handleDelete = (id: string) => {
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
  };

  const refreshBookmarks = async () => {
    try {
      const response = await fetch("/api/bookmarks");
      if (response.ok) {
        const data = await response.json();
        setBookmarks(data.bookmarks);
      }
    } catch (error) {
      console.error("Error refreshing bookmarks:", error);
    }
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Your Bookmarks</h2>
            <p className="text-muted-foreground">
              {bookmarks.length} {bookmarks.length === 1 ? "bookmark" : "bookmarks"}
            </p>
          </div>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Bookmark
          </Button>
        </div>

        {/* Bookmarks grid */}
        {bookmarks.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
            <div className="rounded-full bg-muted p-3 mb-4">
              <BookmarkIcon className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No bookmarks yet</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-sm">
              Start saving your favorite links, notes, and resources. Click the button
              above to create your first bookmark.
            </p>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Bookmark
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {bookmarks.map((bookmark) => (
              <BookmarkCard
                key={bookmark.id}
                bookmark={bookmark}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add bookmark dialog */}
      <AlertDialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Create New Bookmark</AlertDialogTitle>
            <AlertDialogDescription>
              Add a new bookmark to your collection. Paste a URL to automatically
              fetch the title and favicon.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <BookmarkForm
            onSuccess={handleBookmarkAdded}
            onCancel={() => setShowAddDialog(false)}
          />
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit bookmark dialog */}
      <AlertDialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Edit Bookmark</AlertDialogTitle>
            <AlertDialogDescription>
              Update your bookmark details below.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {editingBookmark && (
            <BookmarkForm
              initialData={editingBookmark}
              onSuccess={handleBookmarkUpdated}
              onCancel={() => {
                setShowEditDialog(false);
                setEditingBookmark(null);
              }}
            />
          )}
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
