import { Edge, Node } from 'reactflow';
import { Block, BlockContent, Connection as ApiConnection, LinkBlockContent, TextBlockContent } from './api';

// --- Type Guards ---

export function isTextBlockContent(content: BlockContent | null | undefined): content is TextBlockContent {
    return !!content && typeof (content as TextBlockContent).text === 'string';
}

export function isLinkBlockContent(content: BlockContent | null | undefined): content is LinkBlockContent {
    return !!content && typeof (content as LinkBlockContent).url === 'string';
}

// --- Data Mappers ---

/**
 * Maps an API Block object to a ReactFlow Node object.
 * Determines the node type and label based on the block's type and content.
 */
export const mapBlockToNode = (block: Block): Node => {
    let label = block.type; // Default label
    if (isTextBlockContent(block.content)) {
        label = block.content.text;
    } else if (isLinkBlockContent(block.content)) {
        label = block.content.url;
    }

    let nodeType = 'styledBlockNode'; // Default node type
    if (block.type === 'text') nodeType = 'textBlockNode';
    else if (block.type === 'link') nodeType = 'linkBlockNode';

    return {
        id: block.id,
        type: nodeType,
        position: block.position,
        data: {
            label,
            notes: block.notes,
            rawBlock: block, // Keep the original block data for reference
        },
    };
};

/**
 * Maps an API Connection object to a ReactFlow Edge object.
 */
export const mapConnectionToEdge = (conn: ApiConnection): Edge => ({
    id: conn.id,
    source: conn.sourceBlockId,
    target: conn.targetBlockId,
    sourceHandle: conn.sourceHandle,
    targetHandle: conn.targetHandle,
    // Add other properties like type, animated if needed based on API data
});
