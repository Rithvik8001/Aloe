"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Link as LinkIcon } from "lucide-react";

interface BookmarkFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  initialData?: {
    id?: string;
    url?: string;
    title?: string;
    desc?: string;
    favicon?: string;
    type?: string;
  };
}

export function BookmarkForm({
  onSuccess,
  onCancel,
  initialData,
}: BookmarkFormProps) {
  const [url, setUrl] = useState(initialData?.url || "");
  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(initialData?.desc || "");
  const [favicon, setFavicon] = useState(initialData?.favicon || "");
  const [type, setType] = useState(initialData?.type || "link");
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const urlInputRef = useRef<HTMLInputElement>(null);
  const fetchTimeoutRef = useRef<NodeJS.Timeout>();

  const isEditing = !!initialData?.id;

  // Debounced auto-fetch function
  const fetchMetadata = async (urlToFetch: string) => {
    if (!urlToFetch || urlToFetch.trim() === "") {
      return;
    }

    // Validate URL format
    try {
      new URL(urlToFetch);
    } catch {
      return; // Invalid URL, don't fetch
    }

    setIsLoadingMetadata(true);

    try {
      const response = await fetch("/api/bookmarks/fetch-metadata", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: urlToFetch }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch metadata");
      }

      const data = await response.json();

      // Only set title if it's empty
      if (!title || title === "") {
        setTitle(data.title || "");
      }

      setFavicon(data.favicon || "");

      toast.success("Metadata fetched successfully");
    } catch (error) {
      console.error("Error fetching metadata:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to fetch URL metadata"
      );
    } finally {
      setIsLoadingMetadata(false);
    }
  };

  // Handle URL blur event
  const handleUrlBlur = () => {
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }

    if (type === "link" && url) {
      fetchTimeoutRef.current = setTimeout(() => {
        fetchMetadata(url);
      }, 500);
    }
  };

  // Handle URL paste event
  const handleUrlPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedUrl = e.clipboardData.getData("text");

    if (type === "link" && pastedUrl) {
      setTimeout(() => {
        fetchMetadata(pastedUrl);
      }, 600);
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, []);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    if (type === "link" && !url.trim()) {
      toast.error("URL is required for link bookmarks");
      return;
    }

    setIsSubmitting(true);

    try {
      const endpoint = isEditing
        ? `/api/bookmarks/${initialData?.id}`
        : "/api/bookmarks";

      const method = isEditing ? "PATCH" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: type === "link" ? url : undefined,
          title,
          desc: description || undefined,
          favicon: favicon || undefined,
          type,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save bookmark");
      }

      toast.success(
        isEditing ? "Bookmark updated successfully" : "Bookmark created successfully"
      );

      // Reset form if creating new
      if (!isEditing) {
        setUrl("");
        setTitle("");
        setDescription("");
        setFavicon("");
        setType("link");
      }

      onSuccess?.();
    } catch (error) {
      console.error("Error saving bookmark:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to save bookmark"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Type selector */}
      <div className="space-y-2">
        <Label htmlFor="type">Type</Label>
        <Select value={type} onValueChange={setType} disabled={isEditing}>
          <SelectTrigger id="type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="link">Link</SelectItem>
            <SelectItem value="plain_text">Plain Text</SelectItem>
            <SelectItem value="color">Color</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* URL input (only for link type) */}
      {type === "link" && (
        <div className="space-y-2">
          <Label htmlFor="url">URL</Label>
          <div className="relative">
            <Input
              ref={urlInputRef}
              id="url"
              type="url"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onBlur={handleUrlBlur}
              onPaste={handleUrlPaste}
              required={type === "link"}
              disabled={isLoadingMetadata || isSubmitting}
              className="pr-10"
            />
            {isLoadingMetadata && (
              <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />
            )}
            {!isLoadingMetadata && url && (
              <LinkIcon className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Paste a URL to automatically fetch the title and favicon
          </p>
        </div>
      )}

      {/* Title input */}
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          type="text"
          placeholder="Enter bookmark title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          disabled={isSubmitting}
          maxLength={200}
        />
      </div>

      {/* Description input */}
      <div className="space-y-2">
        <Label htmlFor="description">Description (optional)</Label>
        <Textarea
          id="description"
          placeholder="Add notes or description..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isSubmitting}
          maxLength={1000}
          rows={3}
        />
      </div>

      {/* Favicon preview */}
      {favicon && type === "link" && (
        <div className="space-y-2">
          <Label>Favicon</Label>
          <div className="flex items-center gap-2">
            <img
              src={favicon}
              alt="Favicon"
              className="h-6 w-6 rounded"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
            <span className="text-xs text-muted-foreground truncate">
              {favicon}
            </span>
          </div>
        </div>
      )}

      {/* Form actions */}
      <div className="flex justify-end gap-2 pt-4">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting || isLoadingMetadata}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? "Update" : "Save"} Bookmark
        </Button>
      </div>
    </form>
  );
}
