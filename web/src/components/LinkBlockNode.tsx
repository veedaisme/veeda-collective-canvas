import React, { useEffect, useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Block, BlockContent, LinkBlockContent } from '../lib/api';
import { Card, CardContent } from "@/components/ui/card";
import styles from './StyledBlockNode.module.css';

function isLinkBlockContent(content: BlockContent | null | undefined): content is LinkBlockContent {
    return !!content && typeof (content as LinkBlockContent).url === 'string';
}

interface StyledNodeData {
    label: string;
    notes?: string | null;
    rawBlock: Block;
}

const LinkBlockNode: React.FC<NodeProps<StyledNodeData>> = ({ data, selected }) => {
    const { notes, rawBlock } = data;
    const { content } = rawBlock;

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

        if (isLinkBlockContent(content) && content.url) {
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
                            image: undefined,
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
    }, [content]);

    let displayContent: React.ReactNode = null;
    if (isLinkBlockContent(content)) {
        const displayUrl = content.url.replace(/^(https?:\/\/)?(www\.)?/, '');
        displayContent = <p className={styles.contentLink} title={content.url}>🔗 {displayUrl}</p>;
    } else {
        displayContent = <p className={styles.contentFallback}>(link block)</p>;
    }

    const cardClassName = `${styles.cardBase} ${selected ? styles.selected : ''}`;

    return (
        <Card className={cardClassName}>
            <Handle type="target" position={Position.Top} className={styles.handle} />

            <CardContent className={styles.cardContent}>
                {displayContent}

                {isLinkBlockContent(content) && content.url && (loading || error || linkMeta) && (
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

                {notes && (
                    <p className={styles.notesFootnote}>{notes.substring(0, 60)}...</p>
                )}
            </CardContent>

            <Handle type="source" position={Position.Bottom} className={styles.handle} />
        </Card>
    );
};

export default React.memo(LinkBlockNode);
