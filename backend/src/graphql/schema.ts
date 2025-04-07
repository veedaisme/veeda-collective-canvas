import { createYoga } from "https://esm.sh/graphql-yoga@5.3.1"; // Use CDN
import { makeExecutableSchema } from "https://esm.sh/@graphql-tools/schema@10.0.4"; // Use CDN
import type { BlockRecord, CanvasRecord } from '../data/db.ts'; // Keep type import

// In-memory data stores section (will be removed as imports are not needed here)

// Remove gql import as makeExecutableSchema parses the raw string
// import { gql } from "graphql-yoga";

// GraphQL Schema Definition (Export raw string)
export const typeDefs = `
  scalar DateTime
  scalar JSON # Use standard uppercase JSON scalar

  """Input type for coordinates"""
  input PositionInput {
    x: Float!
    y: Float!
  }

  type Query {
    """Placeholder query"""
    hello: String!
    """Fetches all canvases for the current user (auth placeholder)"""
    myCanvases: [Canvas!]
    """Fetches a specific canvas by its ID (auth placeholder)"""
    canvas(id: ID!): Canvas
    canvases: [Canvas!]!
  }

  type Mutation {
    """Creates a new canvas"""
    createCanvas(title: String): Canvas
    """Updates the title of an existing canvas"""
    updateCanvasTitle(id: ID!, title: String!): Canvas

    """Creates a new block within a specific canvas"""
    createBlock(canvasId: ID!, type: String!, position: PositionInput!, content: JSON): Block # Use JSON

    """Removes a block only if created within the grace period (e.g., 30s)"""
    undoBlockCreation(blockId: ID!): Boolean

    """Updates the position of a block on the canvas"""
    updateBlockPosition(blockId: ID!, position: PositionInput!): Block # Use PositionInput!

    """Updates the content of a block"""
    updateBlockContent(blockId: ID!, content: JSON!): Block # Use JSON

    # TODO: Add mutations for updateBlockSize later
    # TODO: Add mutation for updateBlockOrder later
    # --- Connection Mutations ---
    createConnection(canvasId: ID!, sourceBlockId: ID!, targetBlockId: ID!, sourceHandle: String, targetHandle: String): Connection!
    deleteConnection(connectionId: ID!): Boolean!
  }

  type Canvas {
    id: ID!
    title: String!
    isPublic: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
    """Blocks associated with this canvas"""
    blocks: [Block!] # Add relation to blocks
    """Connections associated with this canvas"""
    connections: [Connection!] # Add relation to connections
  }

  """Represents a single content block on a canvas"""
  type Block {
      id: ID!
      canvasId: ID!
      # userId: ID! # Add user relation later if needed for ownership/permissions
      type: String! # e.g., 'text', 'image', 'link'
      content: JSON! # Use JSON
      position: JSON! # Use JSON
      size: JSON! # Use JSON
      createdAt: DateTime!
      updatedAt: DateTime!
      # Add notes, connections relations later
  }

  type Connection {
    id: ID!
    canvasId: ID!
    sourceBlockId: ID!
    targetBlockId: ID!
    sourceHandle: String
    targetHandle: String
    # Add other connection properties like label, style, etc. later if needed
  }
`; 