import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Block } from '../lib/api'; // Assuming Block type is exported from api
import styles from './LinkNode.module.css'; // Create CSS module

// Define the expected structure of the data prop for this node type
interface LinkNodeData {
    label: string; // The URL itself will be the label
    notes?: string | null;
    rawBlock: Block;
}

const LinkNode: React.FC<NodeProps<LinkNodeData>> = ({ data }) => {
    const { label: url, rawBlock } = data;
    const displayUrl = url?.replace(/^(https?:\/\/)?(www\.)?/, ''); // Clean up for display

    // Get the actual URL for display/title, but don't make it clickable here
    const actualUrl = rawBlock?.type === 'link' && typeof (rawBlock.content as any)?.url === 'string'
        ? (rawBlock.content as any).url
        : null;

    return (
        <div className={styles.linkNode}>
            {/* Input handle (top) */}
            <Handle type="target" position={Position.Top} className={styles.handle} />

            {/* Node Content */}
            <div className={styles.content}>
                <span className={styles.linkIcon}>🔗</span>
                {/* Display the cleaned URL as text, not a link */}
                <span
                    className={styles.linkText} // Use a new class for styling if needed
                    title={actualUrl || 'Invalid Link'} // Show full URL on hover
                >
                    {displayUrl || 'Invalid Link'}
                </span>
            </div>

            {/* Output handle (bottom) */}
            <Handle type="source" position={Position.Bottom} className={styles.handle} />
        </div>
    );
};

export default React.memo(LinkNode); 