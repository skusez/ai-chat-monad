import { Artifact } from "../../components/create-artifact";
import { RouteIcon } from "../../components/icons";
import { TicketForm } from "../../components/ticket-form";
import { DocumentSkeleton } from "../../components/document-skeleton";

// Define the metadata type for the ticket artifact
interface TicketMetadata {
  documentId?: string; // The temporary ID for the artifact
  chatId?: string; // The actual chat ID after form submission
  submitted: boolean; // Whether the form has been submitted
}
export const ticketArtifact = new Artifact<"ticket", TicketMetadata>({
  kind: "ticket",
  description: "Useful for ticket creation",
  initialize: ({ documentId, setMetadata }) => {
    setMetadata({
      documentId,
      submitted: false, // Explicitly set to false
    });
    // No need to fetch anything initially
  },
  onStreamPart: ({ streamPart, setArtifact, setMetadata }) => {
    console.log("Received stream part:", streamPart.type, streamPart.content);

    // Handle text-delta for ticket content
    if (streamPart.type === "text-delta") {
      setArtifact((draftArtifact) => ({
        ...draftArtifact,
        content: draftArtifact.content + (streamPart.content as string),
        isVisible: true,
        status: "streaming",
      }));
    }

    // Handle id for chatId
    if (streamPart.type === "id") {
      setMetadata((metadata) => ({
        ...metadata,
        documentId: streamPart.content as string,
      }));
    }
  },
  content: ({ content, metadata, setMetadata, isLoading }) => {
    console.log("Rendering ticket content with metadata:", metadata);

    if (isLoading) {
      return <DocumentSkeleton artifactKind="ticket" />;
    }

    // If the ticket has been submitted, show a success message
    if (metadata?.submitted === true) {
      return (
        <div className="p-4 border rounded-lg bg-muted/30 mb-4">
          <h3 className="text-lg font-semibold mb-2">Ticket Submitted</h3>
          <p className="text-sm text-muted-foreground">
            Thank you for submitting your project information. You&apos;ve been
            credited with 1000 tokens.
          </p>
        </div>
      );
    }

    // If we have a chatId, show the ticket form
    if (metadata?.documentId) {
      console.log(
        "Rendering ticket form with documentId:",
        metadata.documentId
      );
      const handleSuccess = (chatId: string) => {
        setMetadata((currentMetadata) => ({
          ...currentMetadata,
          chatId,
          submitted: true,
        }));
      };

      return (
        <TicketForm
          documentId={metadata.documentId}
          onSuccess={handleSuccess}
        />
      );
    }
    // If we don't have a documentId yet, show a loading state
    return (
      <div className="p-4 border rounded-lg bg-muted/30 mb-4">
        <h3 className="text-lg font-semibold mb-2">Creating Ticket...</h3>
        <p className="text-sm text-muted-foreground">
          {content || "Please wait while we prepare your ticket form."}
        </p>
      </div>
    );
  },
  actions: [],
  toolbar: [],
});
