# **Design Document: Restriction on Block Deletion in Collective Canvas**

## **Purpose**

This document outlines the design rationale and user experience for disallowing block deletion in the Collective Canvas platform. This restriction is introduced to ensure content integrity, preserve collaboration, and align with the platform’s core principles of intentionality, meaning, and context.

---

## **Core Design Principles**

### **1\. Content Integrity**

* Blocks represent meaningful contributions to a user’s canvas and potentially to others if shared or linked.  
* Preventing deletion ensures that all contributions remain part of the evolving knowledge graph, avoiding loss of valuable context or connections.

### **2\. Collaboration Preservation**

* Linked blocks are often referenced by other users in their canvases. Deletion could disrupt these connections, breaking workflows and causing confusion.  
* By restricting deletion, we maintain a stable and reliable collaborative environment.

### **3\. Intentionality and Accountability**

* The inability to delete blocks encourages users to be deliberate when creating content.  
* Users can still edit or archive blocks to refine their ideas without losing historical context or attribution.

---

## **User Experience Design**

### **1\. Visual Indicators for Non-Deletable Blocks**

To communicate the restriction on deletion clearly:

* **Lock Icon**: Display a small lock icon on all blocks to indicate their protected status.  
* **Tooltip on Hover**: When hovering over the delete option (if visible), display a message like: *"Blocks cannot be deleted to preserve content integrity. You can archive or edit instead."*

### **2\. Alternative Actions for Managing Blocks**

Instead of deletion, users can:

* **Archive Blocks**: Move blocks to an “Archived” section within their canvas or profile. Archived blocks are hidden from active views but remain accessible for reference or restoration.  
* **Edit Content**: Users can update or refine block content as needed while maintaining its original ID and metadata.  
* **Duplicate Blocks**: Create an editable copy of a block if significant changes are required without altering the original content.

### **3\. Handling Linked Blocks**

For blocks linked across canvases:

* Linked blocks remain read-only for other users but cannot be deleted by the original creator if they are actively linked elsewhere.  
* If unlinking is necessary, users can request permission from collaborators or administrators to remove obsolete links.

---

## **Behavioral Rules for Block Management**

### **1\. Default Behavior**

* Blocks cannot be deleted once created, regardless of whether they are standalone or linked to other canvases.  
* Users attempting to delete a block will receive an error message explaining the restriction.

### **2\. Archiving Workflow**

1. Users select the block they wish to archive.  
2. A confirmation dialog appears with the message: *"Archiving will hide this block from your active canvas but keep it accessible in your archive."*  
3. Archived blocks are moved to a dedicated "Archived" section accessible via canvas settings.

### **3\. Editing Workflow**

* Users can edit the content of any block they own while retaining its unique ID and metadata.  
* Edits made to linked blocks will automatically update across all connected canvases unless frozen by collaborators.

---

## **Edge Cases & Solutions**

### **1\. What if a user insists on deleting a block?**

Solution: Provide an option to "Archive Permanently," which hides the block from all views but retains it in the system for traceability and recovery by administrators if needed.

### **2\. What happens if a block becomes irrelevant?**

Solution: Users can unlink the block from their canvas (if it’s linked) or archive it locally while preserving its connections in other users’ canvases.

### **3\. How do we handle accidental creation of blocks?**

Solution: Introduce an "Undo" action immediately after creating a block (e.g., within 5 minutes). After this grace period, the block becomes non-deletable.

---

## **Alignment with Core Principles**

| Principle | How This Design Aligns |
| :---- | :---- |
| Intentionality | Encourages deliberate creation and discourages impulsive deletion of content |
| Meaning and Context | Maintains the contextual integrity of ideas across connected canvases |
| Collaboration | Ensures that shared or linked blocks remain available for all collaborators |
| Simplicity and Clarity | Provides clear alternatives (archiving, editing) for managing content without deletion |

---

## **Future Considerations**

1. **Version Control**:  
   * Implement version histories for blocks so users can track changes over time without deleting prior versions.  
2. **Soft Delete for Admins**:  
   * Allow administrators to soft-delete blocks if necessary (e.g., for moderation purposes) while keeping them recoverable.  
3. **User Education**:  
   * Include onboarding tutorials explaining why deletion is restricted and how users can manage their content effectively using archiving or editing.  
4. **Advanced Archiving Options**:  
   * Enable tagging or categorizing archived blocks for easier retrieval in large collections.

---

By disallowing deletion while offering alternative management options like archiving and editing, this design ensures that Collective Canvas remains a robust platform for mindful curation, collaboration, and knowledge building without compromising content integrity or user experience.

Sources \[1\] Perplexity \- anti fragile ideas [https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/collection\_53d25bf2-7ce6-4705-8382-15c43174601a/9c0de0cf-399a-4770-806a-b9bf03e2c462/Collective-Canvas-Brainstorm-Notes-1.pdf](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/collection_53d25bf2-7ce6-4705-8382-15c43174601a/9c0de0cf-399a-4770-806a-b9bf03e2c462/Collective-Canvas-Brainstorm-Notes-1.pdf) \[2\] The Vision: Collective Canvas \- Your Mindful Space for Ideas [https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/collection\_53d25bf2-7ce6-4705-8382-15c43174601a/9805a5f2-ce94-40a9-87ab-0f64784502ff/The-Vision-Collective-Canvas-Ideas.pdf](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/collection_53d25bf2-7ce6-4705-8382-15c43174601a/9805a5f2-ce94-40a9-87ab-0f64784502ff/The-Vision-Collective-Canvas-Ideas.pdf)

