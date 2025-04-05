# ADR-002: Canvas Rendering Library Choice

**Date:** Current Date
**Status:** Accepted

## Context

The Veeda application requires a frontend component capable of rendering a flexible, interactive canvas where users can place, arrange, and connect visual blocks (representing text, images, links). Key requirements include rendering nodes (blocks) and edges (connections), supporting drag-and-drop for blocks, zooming/panning the canvas viewport, and handling user interactions for creating connections.

## Decision Drivers

*   **Core Functionality:** The library must provide the fundamental features for a node-based editor (rendering nodes/edges, interactions).
*   **Development Speed:** Preference for a higher-level library that handles common canvas/node-editor interactions out-of-the-box to accelerate MVP development.
*   **Customization:** Ability to customize the appearance and behavior of nodes and edges.
*   **Performance:** Should handle a reasonable number of nodes/edges (MVP target: ~100 blocks) without significant performance degradation.
*   **React/TypeScript Integration:** Must integrate well with the React framework and TypeScript.

## Considered Options

### Option 1: `react-flow`

*   A comprehensive library specifically designed for building node-based editors and interactive diagrams.
*   **Pros:**
    *   Provides most required features out-of-the-box (rendering, dragging, zooming, panning, connection handling).
    *   Actively maintained with good documentation and examples.
    *   Highly customizable appearance and behavior.
    *   Designed for React.
*   **Cons:**
    *   Can be considered a higher-level abstraction, potentially less flexible for very unusual, low-level canvas manipulations (not expected for MVP).
    *   Performance with extremely large numbers of nodes might require optimization (unlikely concern for MVP).

### Option 2: Lower-level Canvas Libraries (e.g., `react-konva`, plain SVG/Canvas)

*   Libraries like `react-konva` provide abstractions over the HTML Canvas API, while direct SVG/Canvas manipulation offers maximum control.
*   **Pros:**
    *   Maximum flexibility for custom rendering and interactions.
    *   Potentially better performance in specific edge cases if highly optimized.
*   **Cons:**
    *   Requires significantly more manual implementation for basic node-editor features (node/edge rendering logic, drag-and-drop, zooming/panning calculations, connection line drawing, hit detection).
    *   Greatly increases development time and complexity for the MVP.

### Option 3: Drag-and-Drop Libraries (e.g., `react-draggable`) + Rendering

*   Using a library like `react-draggable` for positioning combined with manual SVG/HTML rendering for blocks and connections.
*   **Pros:**
    *   Simplifies the dragging aspect.
*   **Cons:**
    *   Still requires manual implementation for the canvas context, zooming, panning, and connection rendering/logic.
    *   Less integrated solution compared to a dedicated node-editor library.

## Decision Outcome

**Chosen Option:** `react-flow`.

**Rationale:**

`react-flow` offers the best balance between required functionality and development speed for the MVP. It directly addresses the core need for a node-based editor interface, providing essential features like node/edge rendering, dragging, zooming, panning, and connection management out-of-the-box. While lower-level libraries offer more theoretical flexibility, the significant development overhead required to replicate `react-flow`'s core features is not justified for the MVP. `react-flow`'s customization options are sufficient for the planned features, and its performance is expected to be adequate for the MVP scope.

## Consequences

*   **Positive:**
    *   Faster development of the core canvas interface.
    *   Reduced complexity in handling common node-editor interactions.
    *   Leverages a well-maintained library specifically for this purpose.
*   **Negative:**
    *   Adds a dependency with its specific abstractions and API.
    *   Performance with extremely large graphs (beyond MVP scope) might require specific optimizations later. 