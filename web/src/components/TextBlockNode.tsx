import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Block, BlockContent, TextBlockContent } from '../lib/api';
import { Card, CardContent } from "@/components/ui/card";
import styles from './StyledBlockNode.module.css';

function isTextBlockContent(content: BlockContent | null | undefined): content is TextBlockContent {
    return !!content && typeof (content as TextBlockContent).text === 'string';
}

interface StyledNodeData {
    label: string;
    notes?: string | null;
    rawBlock: Block;
}

const TextBlockNode: React.FC<NodeProps<StyledNodeData>> = ({ data, selected }) => {
    const { notes, rawBlock } = data;
    const { content } = rawBlock;

    let displayContent: React.ReactNode = null;
    if (isTextBlockContent(content)) {
        displayContent = <p className={styles.contentText}>{content.text}</p>;
    } else {
        displayContent = <p className={styles.contentFallback}>(text block)</p>;
    }

    const cardClassName = `${styles.cardBase} ${selected ? styles.selected : ''}`;

    return (
        <Card className={cardClassName}>
            <Handle type="target" position={Position.Top} className={styles.handle} />

            <CardContent className={styles.cardContent}>
                {displayContent}
                {notes && (
                    <p className={styles.notesFootnote}>{notes.substring(0, 60)}...</p>
                )}
            </CardContent>

            <Handle type="source" position={Position.Bottom} className={styles.handle} />
        </Card>
    );
};

export default React.memo(TextBlockNode);
