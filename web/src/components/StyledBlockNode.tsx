import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Block, BlockContent, TextBlockContent, LinkBlockContent } from '../lib/api';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import styles from './StyledBlockNode.module.css';

// Fix any types and restore usage
function isTextBlockContent(content: BlockContent | null | undefined): content is TextBlockContent {
    return !!content && typeof (content as TextBlockContent).text === 'string';
}
function isLinkBlockContent(content: BlockContent | null | undefined): content is LinkBlockContent {
    return !!content && typeof (content as LinkBlockContent).url === 'string';
}

// Define the expected structure of the data prop for this node type
// Note: ReactFlow's NodeProps is generic, data can be anything
// We rely on mapBlockToNode providing the correct structure
interface StyledNodeData {
    label: string; // Primary display (text content, URL, or type)
    notes?: string | null;
    rawBlock: Block;
}

const StyledBlockNode: React.FC<NodeProps<StyledNodeData>> = ({ data, selected }) => {
    const { label, notes, rawBlock } = data; // Label might be unused now
    const { type, content } = rawBlock;

    // Determine content to display
    let displayContent: React.ReactNode = null;
    if (type === 'text' && isTextBlockContent(content)) {
        displayContent = <p className={styles.contentText}>{content.text}</p>;
    } else if (type === 'link' && isLinkBlockContent(content)) {
        const displayUrl = content.url.replace(/^(https?:\/\/)?(www\.)?/, '');
        displayContent = <p className={styles.contentLink} title={content.url}>🔗 {displayUrl}</p>;
    } else {
        displayContent = <p className={styles.contentFallback}>({type} block)</p>;
    }

    const cardClassName = `${styles.cardBase} ${selected ? styles.selected : ''}`;

    return (
        <Card className={cardClassName}>
            <Handle type="target" position={Position.Top} className={styles.handle} />
            
            <CardContent className={styles.cardContent}>
                {/* Display main content */}
                {displayContent}

                {/* Display notes as footnote if they exist */}
                {notes && (
                    <p className={styles.notesFootnote}>{notes.substring(0, 60)}...</p>
                )}
            </CardContent>
                      
            <Handle type="source" position={Position.Bottom} className={styles.handle} />
        </Card>
    );
};

// Use React.memo for performance optimization with React Flow
export default React.memo(StyledBlockNode); 