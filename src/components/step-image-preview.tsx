'use client';

import Image from 'next/image';
import { useI18n } from '@/lib/i18n';
import type { TranslatedString } from '@/lib/types';

interface StepImagePreviewProps {
    imageUrl?: string;
    title: string | TranslatedString;
}

export function StepImagePreview({ imageUrl, title }: StepImagePreviewProps) {
    const { t, locale } = useI18n();

    const getTitle = () => {
        if (typeof title === 'string') {
            return t(title);
        }
        if (title && typeof title === 'object') {
            return title[locale];
        }
        return '';
    };

    const displayTitle = getTitle();
    const isVideo = imageUrl && /\.(mp4|webm|mov)/i.test(imageUrl.split('?')[0]);

    return (
        <div 
            className="relative w-full h-full flex items-center justify-center bg-black overflow-hidden"
        >
            {imageUrl ? (
                <>
                    {isVideo ? (
                        <video
                            ref={(el) => {
                                if (el) {
                                    el.muted = true;
                                    el.playsInline = true;
                                    el.play().catch(err => {
                                        console.warn("Autoplay failed or was blocked: ", err);
                                    });
                                }
                            }}
                            src={imageUrl}
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <Image
                            src={imageUrl}
                            alt={displayTitle || 'Aperçu'}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            className="object-contain p-6"
                            quality={100}
                            priority
                        />
                    )}
                </>
            ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted">
                    <p className="text-muted-foreground">Image non disponible</p>
                </div>
            )}
        </div>
    );
}
