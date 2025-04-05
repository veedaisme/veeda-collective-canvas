
// GraphQL Schema Definition
export const typeDefs = /* GraphQL */ `
  scalar DateTime

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
    # Note: deleteCanvas is intentionally omitted based on requirements
  }

  """Represents a user's canvas"""
  type Canvas {
    id: ID!
    title: String!
    isPublic: Boolean!
    createdAt: DateTime! # Using scalar for ISO String
    updatedAt: DateTime!
    # TODO: Add blocks, connections relations later
  }
`; 