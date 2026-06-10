
'use client';

import { useState, useEffect, useTransition, useCallback, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import type { Theme, Settings as AppSettings } from '@/lib/types';
import { DEFAULT_PALETTES } from '@/lib/color-palettes';
import { saveTheme, deleteTheme, updateSettings } from '@/app/admin/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Trash2, PlusCircle, Loader2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { debounce } from 'lodash';
import { useTheme } from 'next-themes';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const hslToHex = (h: number, s: number, l: number): string => {
  if (isNaN(h) || isNaN(s) || isNaN(l)) return '#ffffff';
  l /= 100;
  const a = s * Math.min(l, 1 - l) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
};

const hexToHsl = (hex: string): string => {
  if (!hex) return '0 0% 100%';
  let r = 0, g = 0, b = 0;
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  } else if (hex.length === 7) {
    r = parseInt(hex.substring(1, 3), 16);
    g = parseInt(hex.substring(3, 5), 16);
    b = parseInt(hex.substring(5, 7), 16);
  }
  
  r /= 255; g /= 255; b /= 255;
  
  let cmin = Math.min(r,g,b), cmax = Math.max(r,g,b), delta = cmax - cmin, h = 0, s = 0, l = 0;

  if (delta === 0) h = 0;
  else if (cmax === r) h = ((g - b) / delta) % 6;
  else if (cmax === g) h = (b - r) / delta + 2;
  else h = (r - g) / delta + 4;

  h = Math.round(h * 60);
  if (h < 0) h += 360;

  l = (cmax + cmin) / 2;
  s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
  s = +(s * 100).toFixed(1);
  l = +(l * 100).toFixed(1);

  return `${h} ${s}% ${l}%`;
};

const applyThemeStyle = (hslColor: string) => {
    const root = document.getElementById('admin-root');
    if (root) {
        root.style.setProperty('--admin-background', `hsl(${hslColor})`);
    }
};


const ColorPickerInput = ({ value, onChange, label }: { value: string, onChange: (value: string) => void, label: string }) => {
    const [hexColor, setHexColor] = useState('#ffffff');

    useEffect(() => {
        try {
            if (value && typeof value === 'string') {
                const parts = value.split(' ').map(p => parseFloat(p.replace('%', '')));
                if (parts.length === 3 && !parts.some(isNaN)) {
                    setHexColor(hslToHex(parts[0], parts[1], parts[2]));
                }
            }
        } catch (e) {
             console.error("Invalid HSL for hex conversion:", value, e);
        }
    }, [value]);
    
    const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newHex = e.target.value;
        setHexColor(newHex);
        if (/^#([0-9A-F]{3}){1,2}$/i.test(newHex)) {
            const newHsl = hexToHsl(newHex);
            applyThemeStyle(newHsl); // Apply change directly to DOM
            onChange(newHsl); // This will trigger the debounced save via form.watch
        }
    };
    
    return (
        <div className="space-y-1">
            <Label className="text-xs">{label}</Label>
            <div className="flex items-center gap-2">
                <Input type="text" value={hexColor} onChange={handleHexChange} className="w-24 h-8" />
                <input type="color" value={hexColor} onChange={handleHexChange} className="w-8 h-8 p-0 border-0 rounded cursor-pointer" />
            </div>
        </div>
    );
};

interface ThemeEditorProps {
    themes: Theme[];
    settings: AppSettings;
    onDataChange: () => void;
}

export function ThemeEditor({ themes: initialThemes, settings: initialSettings, onDataChange }: ThemeEditorProps) {
    const { toast } = useToast();
    const { theme: mode } = useTheme();

    const [activeThemeId, setActiveThemeId] = useState<string | null>(null);
    const [isSaving, startSaving] = useTransition();

    const activeTheme = useMemo(() => initialThemes.find(t => t.id === activeThemeId), [initialThemes, activeThemeId]);
    
    const form = useForm<Theme>({
        defaultValues: { id: '', name: '', colors: { adminBackground: '240 10% 97%' } }
    });

    useEffect(() => {
        const currentThemeId = mode === 'dark' ? initialSettings.darkThemeId : initialSettings.lightThemeId;
        if (currentThemeId && initialThemes.some(t => t.id === currentThemeId)) {
            setActiveThemeId(currentThemeId);
        } else if (initialThemes.length > 0) {
            setActiveThemeId(initialThemes[0].id);
        }
    }, [initialThemes, initialSettings, mode]);

    useEffect(() => {
        if (activeTheme) {
            form.reset(activeTheme);
            applyThemeStyle(activeTheme.colors.adminBackground);
        }
    }, [activeTheme, form]);

    const handleThemeSelect = (theme: Theme) => {
        setActiveThemeId(theme.id);
        applyThemeStyle(theme.colors.adminBackground);
    };

    const debouncedSaveTheme = useCallback(
        debounce(async (data: Theme) => {
            startSaving(async () => {
                await saveTheme(data);
                // No toast on auto-save to keep UI clean
            });
        }, 1500),
        []
    );

    useEffect(() => {
        const subscription = form.watch((value, { name, type }) => {
            if (type === 'change' && activeTheme) {
                if (value.id) {
                    debouncedSaveTheme(value as Theme);
                }
            }
        });
        return () => subscription.unsubscribe();
    }, [form, activeTheme, debouncedSaveTheme]);

    const handleNewTheme = async () => {
        const newName = `Theme ${initialThemes.length + 1}`;
        const defaultColors = DEFAULT_PALETTES[0].colors;
        const newThemeData: Omit<Theme, 'id' | 'createdAt'> = {
            name: newName,
            colors: { ...defaultColors, adminBackground: mode === 'dark' ? '222.2 84% 4.9%' : '240 10% 97%' }
        };
        startSaving(async () => {
             const result = await saveTheme(newThemeData);
             if (result.success && result.theme) {
                toast({ title: "Theme created", variant: 'success' });
                onDataChange(); // Refresh data to include the new theme
                setActiveThemeId(result.theme.id);
             } else {
                toast({ title: "Error", description: "Unable to create theme.", variant: 'destructive' });
             }
        });
    };

    const handleDeleteTheme = async (id: string) => {
        if (initialThemes.length <= 1) {
            toast({ title: 'Action unavailable', description: 'You must keep at least one theme.' });
            return;
        }
        startSaving(async () => {
            const result = await deleteTheme(id);
            if (result.success) {
                toast({ title: 'Theme deleted', variant: 'info' });
                onDataChange();
            } else {
                 toast({ title: 'Error', description: result.error, variant: 'destructive' });
            }
        });
    };

    const handleModeThemeChange = async (themeId: string, themeMode: 'light' | 'dark') => {
        const themeModeKey = themeMode === 'dark' ? 'darkThemeId' : 'lightThemeId';
        await updateSettings({ ...initialSettings, [themeModeKey]: themeId });
        onDataChange(); 
    };
    
    if (initialThemes.length === 0 && !isSaving) {
        return (
            <div className='text-center'>
                <Button onClick={handleNewTheme}><PlusCircle className="mr-2 h-4 w-4"/> Create first theme</Button>
            </div>
        );
    }
    
    if (!activeTheme) {
        return <div className="flex items-center justify-center p-8"><Loader2 className="animate-spin" /></div>;
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Themes by display mode</CardTitle>
                    <CardDescription>
                        Choose a default theme for light mode and dark mode.
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Theme for light mode</Label>
                        <Select value={initialSettings.lightThemeId || ''} onValueChange={(value) => handleModeThemeChange(value, 'light')}>
                            <SelectTrigger>
                                <SelectValue placeholder="Choose a theme..."/>
                            </SelectTrigger>
                            <SelectContent>
                                {initialThemes.map(theme => <SelectItem key={theme.id} value={theme.id}>{theme.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Theme for dark mode</Label>
                        <Select value={initialSettings.darkThemeId || ''} onValueChange={(value) => handleModeThemeChange(value, 'dark')}>
                            <SelectTrigger>
                                <SelectValue placeholder="Choose a theme..."/>
                            </SelectTrigger>
                            <SelectContent>
                                {initialThemes.map(theme => <SelectItem key={theme.id} value={theme.id}>{theme.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
                <div className="flex flex-wrap gap-2 items-center">
                    {initialThemes.map(theme => (
                        <Button
                            key={theme.id}
                            type="button"
                            variant={activeThemeId === theme.id ? 'default' : 'outline'}
                            onClick={() => handleThemeSelect(theme)}
                            className="flex-1"
                        >
                            {theme.name}
                        </Button>
                    ))}
                    <Button type="button" variant="outline" size="icon" onClick={handleNewTheme} disabled={isSaving}>
                        {isSaving ? <Loader2 className="animate-spin" /> : <PlusCircle className="h-4 w-4" />}
                    </Button>
                </div>
                
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <Input {...form.register('name')} className="text-lg font-bold p-0 border-0 shadow-none focus-visible:ring-0 bg-transparent" />
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button type="button" size="sm" variant="destructive-ghost" disabled={initialThemes.length <= 1 || isSaving}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Delete theme?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This action is irreversible.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDeleteTheme(activeThemeId!)}>Delete</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div>
                                <h4 className="font-medium">Admin Interface Colors</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mt-2">
                                    <Controller
                                        name="colors.adminBackground"
                                        control={form.control}
                                        render={({ field }) => (
                                            <ColorPickerInput 
                                                label="Admin Background"
                                                value={field.value || ''}
                                                onChange={field.onChange}
                                            />
                                        )}
                                    />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </form>
        </div>
    );
}
