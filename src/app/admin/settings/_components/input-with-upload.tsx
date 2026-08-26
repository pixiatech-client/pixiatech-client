'use client';

import { useState, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Upload, Loader2, Trash2 } from 'lucide-react';
import { useAdminT } from '@/hooks/useAdminT';
import { useMediaUpload } from '@/hooks/use-media-upload';
import { MediaProgress } from '@/components/ui/media-progress';
import Image from 'next/image';

interface InputWithUploadProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function InputWithUpload({ value, onChange, placeholder }: InputWithUploadProps) {
  const { toast } = useToast();
  const { t } = useAdminT();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { upload, reset, ...mediaState } = useMediaUpload();

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const url = await upload(file);
      if (url) {
        onChange(url);
        toast({ variant: 'success', title: t('Upload successful') });
      }
    } catch (error) {
      console.error('Upload failed', error);
      toast({ variant: 'destructive', title: t('Upload error'), description: (error as Error).message });
    }
  };

  const handleRemoveImage = () => {
    onChange('');
    reset();
  };

  return (
    <div className="flex flex-wrap items-end gap-4">
      <div className="flex-grow">
        <div className="flex gap-2 items-center">
          <Input
            placeholder={placeholder}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={mediaState.status === 'uploading' || mediaState.status === 'processing'}
            title={t('Upload a file')}
          >
            {(mediaState.status === 'uploading' || mediaState.status === 'processing') ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
          </Button>
          {value && (
              <Button
                type="button"
                variant="destructive-ghost"
                size="icon"
                onClick={handleRemoveImage}
                title={t('Remove image')}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
          )}
        </div>
      </div>
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileChange}
        accept="image/*,video/*"
      />
      {value && (
        <div className="relative w-28 h-20 shrink-0 rounded-md overflow-hidden border bg-slate-900 flex items-center justify-center">
           {value.includes('youtube.com') || value.includes('youtu.be') ? (
             <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800 text-white text-[10px] p-2 text-center font-bold">
                 {t('YouTube Link')}
             </div>
           ) : value.match(/\.(mp4|webm|ogg|mov)(\?|$)/i) || value.includes('Devis%20Ecran') || value.includes('.mp4') ? (
             <video src={value} className="w-full h-full object-cover" muted playsInline autoPlay loop />
           ) : (
              <img src={value} alt={t('Preview')} className="w-full h-full object-cover" />
           )}
        </div>
      )}
      {/* Media progress indicator */}
      <MediaProgress
        state={mediaState}
        className="w-full"
        onRetry={() => {
          const input = fileInputRef.current;
          if (input?.files?.[0]) {
            handleFileChange({ target: { files: input.files } } as any);
          }
        }}
      />
    </div>
  );
}
