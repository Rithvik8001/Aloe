"use client";

import { useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";

interface QuickAddInputProps {
  onSuccess?: () => void;
}

export function QuickAddInput({ onSuccess }: QuickAddInputProps) {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isURL = (text: string): boolean => {
    try {
      new URL(text);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim()) return;

    setIsLoading(true);

    try {
      const isLink = isURL(input.trim());
      let bookmarkData: {
        url?: string;
        title: string;
        type: string;
        favicon?: string;
      };

      if (isLink) {
        // Fetch metadata for URLs
        try {
          const metadataResponse = await fetch(
            "/api/bookmarks/fetch-metadata",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ url: input.trim() }),
            }
          );

          if (metadataResponse.ok) {
            const metadata = await metadataResponse.json();
            bookmarkData = {
              url: metadata.url,
              title: metadata.title,
              favicon: metadata.favicon,
              type: "link",
            };
          } else {
            // Fallback if metadata fetch fails
            bookmarkData = {
              url: input.trim(),
              title: new URL(input.trim()).hostname,
              type: "link",
            };
          }
        } catch {
          bookmarkData = {
            url: input.trim(),
            title: new URL(input.trim()).hostname,
            type: "link",
          };
        }
      } else {
        // Plain text
        bookmarkData = {
          title: input.trim(),
          type: "plain_text",
        };
      }

      // Create bookmark
      const response = await fetch("/api/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookmarkData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create bookmark");
      }

      setInput("");
      toast.success("Bookmark added");
      onSuccess?.();
    } catch (error) {
      console.error("Error creating bookmark:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to add bookmark"
      );
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="relative flex items-center">
        <Plus className="absolute left-3 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Insert a link, image, or just plain text..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isLoading}
          className="h-10 pl-10 pr-10 text-sm bg-card/50 border-border/50 focus-visible:bg-card transition-colors"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>
    </form>
  );
}
