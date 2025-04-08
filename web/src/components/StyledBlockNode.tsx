import React, { useEffect, useState } from 'react';
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

    const [linkMeta, setLinkMeta] = useState<{
        title?: string;
        description?: string;
        favicon?: string;
        image?: string;
        hostname?: string;
    } | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let errorTimeout: NodeJS.Timeout | null = null;

        if (type === 'link' && isLinkBlockContent(content) && content.url) {
            const url = content.url.startsWith('http') ? content.url : `https://${content.url}`;
            setLoading(true);
            setError(null);
            setLinkMeta(null);

            const isTwitter = url.includes('twitter.com');

            if (isTwitter) {
                const oembedUrl = `https://publish.twitter.com/oembed?url=${encodeURIComponent(url)}`;
                fetch(oembedUrl)
                    .then(async (res) => {
                        if (!res.ok) throw new Error('oEmbed fetch failed');
                        const data = await res.json();
                        setLinkMeta({
                            title: data.author_name,
                            description: data.html.replace(/<[^>]+>/g, '').slice(0, 200),
                            image: undefined, // Twitter oEmbed doesn't provide image URL
                            favicon: undefined,
                            hostname: 'twitter.com',
                        });
                    })
                    .catch((err) => {
                        console.error('Error fetching Twitter oEmbed:', err);
                        setError('Failed to load preview');
                        errorTimeout = setTimeout(() => {
                            setError(null);
                        }, 3000);
                    })
                    .finally(() => setLoading(false));
            } else {
                fetch(url)
                    .then(async (res) => {
                        const text = await res.text();
                        const parser = new DOMParser();
                        const doc = parser.parseFromString(text, 'text/html');

                        const hostname = (() => {
                            try {
                                return new URL(url).hostname;
                            } catch {
                                return url;
                            }
                        })();

                        const getMeta = (property: string) =>
                            doc.querySelector(`meta[property='${property}']`)?.getAttribute('content') ||
                            doc.querySelector(`meta[name='${property}']`)?.getAttribute('content') ||
                            '';

                        const title =
                            getMeta('og:title') ||
                            doc.querySelector('title')?.innerText ||
                            hostname;

                        const description =
                            getMeta('og:description') ||
                            getMeta('description') ||
                            '';

                        let imageUrl = getMeta('og:image') || '';
                        if (imageUrl && !imageUrl.startsWith('http')) {
                            try {
                                imageUrl = new URL(imageUrl, url).href;
                            } catch {}
                        }

                        let faviconUrl = '';
                        const iconLink = doc.querySelector('link[rel~="icon"]') as HTMLLinkElement | null;
                        if (iconLink) {
                            faviconUrl = iconLink.href;
                            if (faviconUrl && !faviconUrl.startsWith('http')) {
                                try {
                                    faviconUrl = new URL(faviconUrl, url).href;
                                } catch {}
                            }
                        }

                        setLinkMeta({
                            title,
                            description,
                            favicon: faviconUrl,
                            image: imageUrl,
                            hostname,
                        });
                    })
                    .catch((err) => {
                        console.error('Error fetching link metadata:', err);
                        setError('Failed to load preview');
                        errorTimeout = setTimeout(() => {
                            setError(null);
                        }, 3000);
                    })
                    .finally(() => setLoading(false));
            }
        }

        return () => {
            if (errorTimeout) clearTimeout(errorTimeout);
        };
    }, [type, content]);

    const cardClassName = `${styles.cardBase} ${selected ? styles.selected : ''}`;

    return (
        <Card className={cardClassName}>
            <Handle type="target" position={Position.Top} className={styles.handle} />
            
            <CardContent className={styles.cardContent}>
                {/* Display main content */}
                {displayContent}

                {/* Link preview for link blocks */}
                {type === 'link' && isLinkBlockContent(content) && content.url && (
                    <div className={styles.linkPreview}>
                        {loading && <p>Loading preview...</p>}
                        {error && <p className={styles.previewError}>{error}</p>}
                        {!loading && !error && linkMeta && (
                            <a
                                href={content.url.startsWith('http') ? content.url : `https://${content.url}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.previewLinkRich}
                            >
                                {linkMeta.image && (
                                    <img src={linkMeta.image} alt="preview" className={styles.previewImage} />
                                )}
                                <div className={styles.previewText}>
                                    {linkMeta.description && (
                                        <div className={styles.previewDescription}>{linkMeta.description}</div>
                                    )}
                                </div>
                            </a>
                        )}
                    </div>
                )}

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
