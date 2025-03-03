import { createDocumentHandler } from "../../lib/artifacts/server";
// artifacts/ticket/server.ts
export const ticketDocumentHandler = createDocumentHandler<"ticket">({
  kind: "ticket",
  onCreateDocument: async ({ id, title, dataStream, session }) => {
    // Don't create a database record yet, just prepare the UI
    let draftContent = title || "New Ticket";

    // Send a temporary ID to the client
    // This ID will be used to identify this specific artifact instance
    dataStream.writeData({
      type: "id",
      content: id, // Use the document ID as the temporary ID
    });

    return draftContent;
  },
  onUpdateDocument: async ({ document, description, dataStream, session }) => {
    // This is called when the document is updated, not when the form is submitted
    return document.content || "";
  },
});
