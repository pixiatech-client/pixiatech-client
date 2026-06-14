

'use client';

import React, { useState, useTransition, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, writeBatch, doc, deleteDoc, updateDoc, addDoc, query, orderBy, limit, startAfter, getDocs, where, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import type { City, Zone } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { PlusCircle, Trash2, Loader2, FilePen, ChevronLeft, ChevronRight, FolderUp, Palette, ChevronDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CustomSelect } from '@/components/ui/custom-select';
import { Pagination } from '@/components/ui/Pagination';
import { useAdminT } from '@/hooks/useAdminT';


const ITEMS_PER_PAGE = 8;
const COLORS = [
  '#a855f7', '#d946ef', '#ec4899', '#ef4444', '#f97316', '#eab308',
  '#84cc16', '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6',
];


function ZoneEditor({ onZoneUpdate }: { onZoneUpdate: () => void }) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const { t } = useAdminT();
  const [isPending, startTransition] = useTransition();
  const [newZoneName, setNewZoneName] = useState('');
  const [newZoneColor, setNewZoneColor] = useState(COLORS[0]);
  
  const zonesQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'zones'), orderBy('name')) : null, [firestore]);
  const { data: zones, isLoading: isLoadingZones } = useCollection<Zone>(zonesQuery, { suppressPermissionError: true });

  const handleAddZone = () => {
    if (!newZoneName.trim() || !firestore) return;
    startTransition(async () => {
      try {
        await addDoc(collection(firestore, 'zones'), { name: newZoneName.trim(), color: newZoneColor });
        toast({ title: t("Zone added"), variant: 'success' });
        setNewZoneName('');
        setNewZoneColor(COLORS[0]);
        onZoneUpdate();
      } catch (error) {
        toast({ title: t("Error"), description: t("Unable to add zone."), variant: 'destructive' });
      }
    });
  };

  const handleDeleteZone = (zoneId: string) => {
    if (!firestore) return;
    startTransition(async () => {
        try {
            const citiesInZoneQuery = query(collection(firestore, 'cities'), where('zoneId', '==', zoneId));
            const citiesSnapshot = await getDocs(citiesInZoneQuery);
            const batch = writeBatch(firestore);
            citiesSnapshot.forEach(cityDoc => {
                batch.update(cityDoc.ref, { zoneId: null });
            });
            
            await batch.commit();

            await deleteDoc(doc(firestore, 'zones', zoneId));

            toast({ title: t("Zone deleted"), description: t("Associated cities have been unassigned."), variant: 'info' });
            onZoneUpdate();
        } catch (error) {
            console.error("Error deleting zone: ", error);
            toast({ title: t("Error"), description: t("Unable to delete zone."), variant: 'destructive' });
        }
    });
  };

  return (
    <Card className="border-0 md:border rounded-none md:rounded-xl shadow-none md:shadow-sm bg-transparent md:bg-white">
      <CardHeader className="px-0 md:px-6">
        <CardTitle>Zone Management</CardTitle>
        <CardDescription>Create geographic zones and assign them a color for better organization.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 px-0 md:px-6">
        <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon" className="w-10 h-10">
                <Palette className="h-5 w-5" style={{ color: newZoneColor }} />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2">
              <div className="grid grid-cols-7 gap-1">
                {COLORS.map(color => (
                  <button
                    key={color}
                    onClick={() => setNewZoneColor(color)}
                    className="w-6 h-6 rounded-full border-2"
                    style={{ backgroundColor: color, borderColor: newZoneColor === color ? '#3b82f6' : 'transparent' }}
                  />
                ))}
              </div>
            </PopoverContent>
          </Popover>
          <Input
            placeholder="Name of the new zone (e.g., Zone A, South Paris...)"
            value={newZoneName}
            onChange={(e) => setNewZoneName(e.target.value)}
          />
          <Button onClick={handleAddZone} disabled={isPending || !newZoneName.trim()}>
            {isPending ? <Loader2 className="animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
            Create
          </Button>
        </div>
        <div className="border rounded-md">
            <Table>
                <TableBody>
                    {isLoadingZones ? (
                         <TableRow><TableCell className="h-24 text-center"><Loader2 className="animate-spin inline-block mr-2" /> Loading...</TableCell></TableRow>
                    ) : zones && zones.length > 0 ? (
                        zones.map(zone => (
                            <TableRow key={zone.id}>
                                <TableCell>
                                    <Badge style={{ backgroundColor: zone.color, color: 'white' }}>{zone.name}</Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteZone(zone.id)} disabled={isPending}>
                                        <Trash2 className="h-4 w-4"/>
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                         <TableRow><TableCell className="text-center h-24">No zones created.</TableCell></TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
      </CardContent>
    </Card>
  );
}


export function ZoneManager() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const { t } = useAdminT();
  const [isPending, startTransition] = useTransition();

  const [cities, setCities] = useState<City[]>([]);
  const [isLoadingCities, setIsLoadingCities] = useState(true);

  const zonesQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'zones'), orderBy('name')) : null, [firestore]);
  const { data: zones, isLoading: isLoadingZones, error: zonesError } = useCollection<Zone>(zonesQuery, { suppressPermissionError: true });

  const [newCitiesText, setNewCitiesText] = useState('');
  const [selectedCityIds, setSelectedCityIds] = useState<string[]>([]);
  const [editingCity, setEditingCity] = useState<City | null>(null);
  const [citiesToDelete, setCitiesToDelete] = useState<string[] | null>(null);
  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);
  const [targetZoneId, setTargetZoneId] = useState<string>('');
  const [expandedCityId, setExpandedCityId] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageCursors, setPageCursors] = useState<Record<number, QueryDocumentSnapshot<DocumentData> | null>>({ 1: null });
  const [hasMore, setHasMore] = useState(true);

  const fetchCitiesForPage = useCallback(async (page: number) => {
    if (!firestore) return;
    setIsLoadingCities(true);
    try {
      let q = query(collection(firestore, 'cities'), orderBy('name'), limit(ITEMS_PER_PAGE));
      if (page > 1 && pageCursors[page]) {
        q = query(q, startAfter(pageCursors[page]));
      }
      
      const snapshot = await getDocs(q);
      const fetchedCities = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as City));
      setCities(fetchedCities);

      const lastVisible = snapshot.docs[snapshot.docs.length - 1];
      setHasMore(snapshot.docs.length === ITEMS_PER_PAGE);

      if (lastVisible) {
        setPageCursors(prev => ({ ...prev, [page + 1]: lastVisible }));
      }
    } catch (error) {
      console.error("Error fetching cities: ", error);
      toast({ title: "Loading error", description: "Unable to load cities.", variant: 'destructive' });
    } finally {
      setIsLoadingCities(false);
    }
  }, [firestore, pageCursors, toast]);

  useEffect(() => {
    fetchCitiesForPage(currentPage);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);
  
  const refreshCurrentPage = () => {
      fetchCitiesForPage(currentPage);
  }

  const handleAddCities = () => {
    const lines = newCitiesText.split('\n').map(line => line.trim()).filter(Boolean);
    if (lines.length === 0 || !firestore) return;

    startTransition(async () => {
      try {
        const batch = writeBatch(firestore);
        const citiesToAdd: { name: string; postalCode: string }[] = [];

        for (const line of lines) {
          const parts = line.split(',').map(p => p.trim());
          if (parts.length === 2) {
            citiesToAdd.push({ name: parts[0], postalCode: parts[1] });
          }
        }

        if (citiesToAdd.length === 0) {
          toast({ title: "Invalid format", description: "Please use the format 'City, Postal Code'.", variant: 'destructive' });
          return;
        }

        citiesToAdd.forEach(city => {
          const newDocRef = doc(collection(firestore, 'cities'));
          batch.set(newDocRef, city);
        });

        await batch.commit();
        toast({ title: `${citiesToAdd.length} city(ies) added`, variant: 'success' });
        setNewCitiesText('');
        refreshCurrentPage();
      } catch (error) {
        console.error("Error adding cities: ", error);
        toast({ title: "Error", description: "Unable to add cities.", variant: 'destructive' });
      }
    });
  };

  const handleDeleteCities = () => {
    if (!citiesToDelete || citiesToDelete.length === 0 || !firestore) return;

    startTransition(async () => {
      try {
        const batch = writeBatch(firestore);
        citiesToDelete.forEach(cityId => {
          batch.delete(doc(firestore, 'cities', cityId));
        });
        await batch.commit();

        toast({ title: "City(ies) deleted", variant: 'info' });
        setCitiesToDelete(null);
        setSelectedCityIds([]);
        refreshCurrentPage();
      } catch (error) {
        console.error("Error deleting cities: ", error);
        toast({ title: "Deletion error", variant: 'destructive' });
      }
    });
  };
  
  const handleUpdateCity = async () => {
    if (!editingCity || !firestore || !editingCity.name.trim() || !editingCity.postalCode.trim()) return;

    startTransition(async () => {
      try {
        const cityRef = doc(firestore, 'cities', editingCity.id);
        await updateDoc(cityRef, { name: editingCity.name, postalCode: editingCity.postalCode });
        toast({ title: "City updated", variant: 'success' });
        setEditingCity(null);
        refreshCurrentPage();
      } catch (error) {
        console.error("Error updating city: ", error);
        toast({ title: "Error", description: "Unable to update city.", variant: 'destructive' });
      }
    });
  };

  const handleAssignToZone = async () => {
    if (!targetZoneId || selectedCityIds.length === 0 || !firestore) return;

    startTransition(async () => {
        try {
            const batch = writeBatch(firestore);
            selectedCityIds.forEach(cityId => {
                const cityRef = doc(firestore, 'cities', cityId);
                batch.update(cityRef, { zoneId: targetZoneId });
            });
            await batch.commit();
            toast({ title: "Assignment successful", description: `${selectedCityIds.length} city(ies) moved to zone.`, variant: 'success'});
            setAssignmentModalOpen(false);
            setSelectedCityIds([]);
            refreshCurrentPage();
        } catch (error) {
            console.error("Error assigning cities to zone: ", error);
            toast({ title: "Assignment error", variant: 'destructive' });
        }
    });
  }

  const handleSelectAll = (checked: boolean) => {
    setSelectedCityIds(checked && cities ? cities.map(c => c.id) : []);
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    setSelectedCityIds(prev => checked ? [...prev, id] : prev.filter(cityId => cityId !== id));
  };

  const isAllSelected = cities && cities.length > 0 && selectedCityIds.length === cities.length;

  return (
    <div className="space-y-6">
        <ZoneEditor onZoneUpdate={refreshCurrentPage}/>

        <Card className="border-0 md:border rounded-none md:rounded-xl shadow-none md:shadow-sm bg-transparent md:bg-white">
        <CardHeader className="px-0 md:px-6">
            <CardTitle>City Management</CardTitle>
            <CardDescription>Add, edit, and assign cities to your delivery zones.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 px-0 md:px-6">
            <div className="flex flex-col sm:flex-row gap-2">
            <Textarea
                placeholder={"Paris, 75001\nMarseille, 13001\n(one city per line, separated by a comma)"}
                value={newCitiesText}
                onChange={(e) => setNewCitiesText(e.target.value)}
                rows={4}
                className="flex-grow"
            />
            <Button onClick={handleAddCities} disabled={isPending || !newCitiesText.trim()} className="w-full sm:w-auto">
                {isPending ? <Loader2 className="animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                Add
            </Button>
            </div>

            {selectedCityIds.length > 0 && (
            <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setAssignmentModalOpen(true)}>
                    <FolderUp className="mr-2 h-4 w-4" />
                    Move ({selectedCityIds.length})
                </Button>
                <Button variant="destructive" onClick={() => setCitiesToDelete(selectedCityIds)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete ({selectedCityIds.length})
                </Button>
            </div>
            )}

            <div className="border rounded-lg overflow-hidden">
            <Table>
                <TableHeader className="bg-slate-50/50 hidden md:table-header-group">
                  <TableRow className="border-b border-slate-200">
                    <TableHead className="w-[50px]">
                      <Checkbox
                        checked={!!isAllSelected}
                        onCheckedChange={handleSelectAll}
                        aria-label="Select all"
                      />
                    </TableHead>
                    <TableHead>Ville</TableHead>
                    <TableHead>Code Postal</TableHead>
                    <TableHead>Zone</TableHead>
                    <TableHead className="text-right">{t('Actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                {isLoadingCities ? (
                    <TableRow><TableCell colSpan={5} className="text-center h-24"><Loader2 className="animate-spin inline-block mr-2" /> {t('Loading...')}</TableCell></TableRow>
                ) : cities && cities.length > 0 ? (
                    cities.map(city => {
                        const zone = zones?.find(z => z.id === city.zoneId);
                        return (
                            <React.Fragment key={city.id}>
                                {/* PC VIEW */}
                                <TableRow className="hidden md:table-row" data-state={selectedCityIds.includes(city.id) ? 'selected' : ''}>
                                    <TableCell>
                                    <Checkbox
                                        checked={selectedCityIds.includes(city.id)}
                                        onCheckedChange={(checked) => handleSelectOne(city.id, !!checked)}
                                        aria-label={`Select ${city.name}`}
                                    />
                                    </TableCell>
                                    <TableCell className="font-bold text-slate-900">{city.name}</TableCell>
                                    <TableCell className="font-medium text-slate-600">{city.postalCode}</TableCell>
                                    <TableCell>{zone ? <Badge style={{ backgroundColor: zone.color, color: 'white' }}>{zone.name}</Badge> : <span className="text-muted-foreground italic">None</span>}</TableCell>
                                    <TableCell className="text-right">
                                    <Button variant="ghost" size="icon" onClick={() => setEditingCity(city)}><FilePen className="h-4 w-4" /></Button>
                                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setCitiesToDelete([city.id])}><Trash2 className="h-4 w-4" /></Button>
                                    </TableCell>
                                </TableRow>

                                {/* MOBILE VIEW */}
                                <TableRow className="md:hidden border-b border-slate-100 hover:bg-zinc-50 transition-colors">
                                    <TableCell colSpan={5} className="p-0">
                                        <div className="w-full">
                                            <div 
                                                className="flex items-center p-4 gap-3 cursor-pointer active:bg-slate-50 transition-colors"
                                                onClick={() => setExpandedCityId(expandedCityId === city.id ? null : city.id)}
                                            >
                                                <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
                                                    <Checkbox
                                                        checked={selectedCityIds.includes(city.id)}
                                                        onCheckedChange={(checked) => handleSelectOne(city.id, !!checked)}
                                                        className="w-5 h-5 rounded-md"
                                                    />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-black text-slate-900 text-sm tracking-tight truncate">{city.name}</div>
                                                    <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">{city.postalCode}</div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {zone && (
                                                        <Badge 
                                                            style={{ backgroundColor: zone.color, color: 'white' }} 
                                                            className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 h-auto border-none"
                                                        >
                                                            {zone.name}
                                                        </Badge>
                                                    )}
                                                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center">
                                                        <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform duration-300", expandedCityId === city.id && "rotate-180")} />
                                                    </div>
                                                </div>
                                            </div>

                                            <AnimatePresence initial={false}>
                                                {expandedCityId === city.id && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        transition={{ duration: 0.2, ease: "easeInOut" }}
                                                        className="overflow-hidden bg-slate-50/50 border-t border-slate-100"
                                                    >
                                                        <div className="px-4 py-3 flex items-center justify-between gap-4">
                                                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Quick options</div>
                                                            <div className="flex gap-2">
                                                                <Button 
                                                                    variant="outline" 
                                                                    size="sm" 
                                                                    onClick={(e) => { e.stopPropagation(); setEditingCity(city); }}
                                                                    className="h-8 px-3 text-[10px] font-black uppercase tracking-widest bg-white hover:bg-slate-900 hover:text-white transition-all rounded-lg"
                                                                >
                                                                     <FilePen className="w-3.5 h-3.5 mr-1.5" /> Edit
                                                                </Button>
                                                                <Button 
                                                                    variant="outline" 
                                                                    size="sm" 
                                                                    onClick={(e) => { e.stopPropagation(); setCitiesToDelete([city.id]); }}
                                                                    className="h-8 px-3 text-[10px] font-black uppercase tracking-widest bg-white text-destructive border-destructive/20 hover:bg-destructive hover:text-white transition-all rounded-lg"
                                                                >
                                                                     <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Delete
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            </React.Fragment>
                        )
                    })
                ) : (
                    <TableRow><TableCell colSpan={5} className="text-center h-24 text-slate-400 font-medium italic">No cities added.</TableCell></TableRow>
                )}
                </TableBody>
            </Table>
            </div>


            <Pagination
                currentPage={currentPage}
                hasMore={hasMore}
                onPageChange={setCurrentPage}
            />
        </CardContent>

        {/* Edit Dialog */}
        <AlertDialog open={!!editingCity} onOpenChange={(open) => !open && setEditingCity(null)}>
            <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>{t('Edit city')}</AlertDialogTitle>
                <AlertDialogDescription>
                    Modify the name or postal code of this city.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-4">
                <Input
                placeholder="City name"
                value={editingCity?.name || ''}
                onChange={(e) => setEditingCity(prev => prev ? { ...prev, name: e.target.value } : null)}
                />
                <Input
                placeholder="Postal Code"
                value={editingCity?.postalCode || ''}
                onChange={(e) => setEditingCity(prev => prev ? { ...prev, postalCode: e.target.value } : null)}
                />
            </div>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleUpdateCity} disabled={isPending}>
                {isPending ? t('Saving...') : t('Save')}
                </AlertDialogAction>
            </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!citiesToDelete} onOpenChange={(open) => !open && setCitiesToDelete(null)}>
            <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>{t('Are you sure you want to delete ')}{citiesToDelete?.length}{t(' city(ies)?')}</AlertDialogTitle>
                <AlertDialogDescription>{t('This action is irreversible.')}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={handleDeleteCities} disabled={isPending}>
                {isPending ? t('Deleting...') : t('Delete')}
                </AlertDialogAction>
            </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

         {/* Zone Assignment Dialog */}
        <Dialog open={assignmentModalOpen} onOpenChange={setAssignmentModalOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Move to zone</DialogTitle>
                    <DialogDescription>
                        Select a zone to assign the {selectedCityIds.length} selected city(ies) to.
                    </DialogDescription>
                </DialogHeader>
                 <div className="py-4">
                    <CustomSelect
                      options={zones?.map(zone => ({ value: zone.id, label: zone.name, color: zone.color })) || []}
                      value={targetZoneId}
                      onChange={setTargetZoneId}
                      placeholder="Choose a zone..."
                      className="w-full"
                    />
                 </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setAssignmentModalOpen(false)}>Cancel</Button>
                    <Button onClick={handleAssignToZone} disabled={isPending || !targetZoneId}>
                        {isPending ? "Moving..." : "Move"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        </Card>
    </div>
  );
}



