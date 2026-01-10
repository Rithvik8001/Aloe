"use client";

import { useState } from "react";
import { QuickAddInput } from "./quick-add-input";
import { BookmarkRow } from "./bookmark-row";

interface Bookmark {
  id: string;
  url?: string | null;
  title: string;
  desc?: string | null;
  favicon?: string | null;
  type: string;
  createdAt: Date;
}

interface MinimalBookmarkListProps {
  initialBookmarks: Bookmark[];
}

export function MinimalBookmarkList({
  initialBookmarks,
}: MinimalBookmarkListProps) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(initialBookmarks);

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

  const handleDelete = (id: string) => {
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-6 space-y-4">
      <QuickAddInput onSuccess={refreshBookmarks} />

      {bookmarks.length > 0 ? (
        <div className="space-y-1">
          <div className="flex items-center gap-4 py-2 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            <div className="w-5"></div>
            <div className="flex-1">Title</div>
            <div className="shrink-0">Created</div>
            <div className="w-8"></div>
          </div>
          <div className="space-y-0.5">
            {bookmarks.map((bookmark) => (
              <BookmarkRow
                key={bookmark.id}
                bookmark={bookmark}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-sm text-muted-foreground">
            No bookmarks yet. Add one above.
          </p>
        </div>
      )}
    </div>
  );
}
