import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { toast } from "sonner";
import { BLOCKCHAIN_CONFIG } from "../lib/config";

interface TicketFormProps {
  documentId: string;
  onSuccess: (chatId: string) => void; // Modified to return the new chatId
}

export function TicketForm({ documentId, onSuccess }: TicketFormProps) {
  const [projectName, setProjectName] = useState("");
  const [projectWebsite, setProjectWebsite] = useState("");
  const [discordLink, setDiscordLink] = useState("");
  const [docsLink, setDocsLink] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!projectName) {
      toast.error("Please provide a project name.");
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch("/api/ticket", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          documentId,
          projectName,
          projectWebsite,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit ticket information");
      }

      toast.success(
        "Ticket submitted successfully! You've been credited with 1000 tokens."
      );

      onSuccess(data.chatId);
    } catch (error) {
      console.error("Error submitting ticket:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to submit ticket information"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-muted/30 mb-4">
      <h3 className="text-lg font-semibold mb-2">Submit Project Information</h3>
      <p className="mb-4 text-sm text-muted-foreground">
        Creating this ticket will provide the {BLOCKCHAIN_CONFIG.ecosystemName}{" "}
        assistant with context about your project.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="projectName">
            Project Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="projectName"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="Enter your project name"
            required
          />
        </div>
        <div className="space-y-4">
          <h4 className="text-md font-semibold mb-2">
            Provide Additional Context (Optional)
          </h4>
          <p className="mb-4 text-sm text-muted-foreground">
            The more context you provide, the better the{" "}
            {BLOCKCHAIN_CONFIG.ecosystemName} assistant will understand your
            project.
          </p>

          <div className="space-y-2">
            <Label htmlFor="projectWebsite">Project Website</Label>
            <Input
              id="projectWebsite"
              value={projectWebsite}
              onChange={(e) => setProjectWebsite(e.target.value)}
              placeholder="https://your-project-website.com"
              type="url"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="discordLink">Discord Link</Label>
            <Input
              id="discordLink"
              value={discordLink}
              onChange={(e) => setDiscordLink(e.target.value)}
              placeholder="https://discord.gg/your-server"
              type="url"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="docsLink">Documentation Link</Label>
            <Input
              id="docsLink"
              value={docsLink}
              onChange={(e) => setDocsLink(e.target.value)}
              placeholder="https://your-project-docs.com"
              type="url"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit"}
          </Button>
        </div>
      </form>
    </div>
  );
}
