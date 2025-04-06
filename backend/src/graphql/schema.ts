// Remove gql import as makeExecutableSchema parses the raw string
// import { gql } from "graphql-yoga";

// GraphQL Schema Definition (Export raw string)
export const typeDefs = `
  scalar DateTime
  scalar Json # For flexible content, position, size

  type Query {
    """Placeholder query"""
    hello: String!
    """Fetches all canvases for the current user (auth placeholder)"""
    myCanvases: [Canvas!]
    """Fetches a specific canvas by its ID (auth placeholder)"""
    canvas(id: ID!): Canvas
  }

  type Mutation {
    """Creates a new canvas"""
    createCanvas(title: String): Canvas
    """Updates the title of an existing canvas"""
    updateCanvasTitle(id: ID!, title: String!): Canvas

    """Creates a new block within a specific canvas"""
    createBlock(canvasId: ID!, type: String!, position: Json!, content: Json): Block # content optional initially?

    """Removes a block only if created within the grace period (e.g., 30s)"""
    undoBlockCreation(blockId: ID!): Boolean

    """Updates the position of a block on the canvas"""
    updateBlockPosition(blockId: ID!, position: Json!): Block

    """Updates the content of a block"""
    updateBlockContent(blockId: ID!, content: Json!): Block

    # TODO: Add mutations for updateBlockSize later
  }

  type Canvas {
    id: ID!
    title: String!
    isPublic: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
    """Blocks associated with this canvas"""
    blocks: [Block!] # Add relation to blocks
  }

  """Represents a single content block on a canvas"""
  type Block {
      id: ID!
      canvasId: ID!
      # userId: ID! # Add user relation later if needed for ownership/permissions
      type: String! # e.g., 'text', 'image', 'link'
      content: Json! # Flexible content based on type
      position: Json! # { x: number, y: number }
      size: Json! # { width: number, height: number } - Define later
      createdAt: DateTime!
      updatedAt: DateTime!
      # Add notes, connections relations later
  }
`; 