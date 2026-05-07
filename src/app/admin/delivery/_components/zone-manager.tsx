

'use client';

import { useState, useTransition, useCallback, useEffect } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, writeBatch, doc, deleteDoc, updateDoc, addDoc, query, orderBy, limit, startAfter, getDocs, where, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import type { City, Zone } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { PlusCircle, Trash2, Loader2, FilePen, ChevronLeft, ChevronRight, FolderUp, Palette } from 'lucide-react';
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


const ITEMS_PER_PAGE = 8;
const COLORS = [
  '#a855f7', '#d946ef', '#ec4899', '#ef4444', '#f97316', '#eab308',
  '#84cc16', '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6',
];


function ZoneEditor({ onZoneUpdate }: { onZoneUpdate: () => void }) {
  const firestore = useFirestore();
  const { toast } = useToast();
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
        toast({ title: "Zone ajoutée", variant: 'success' });
        setNewZoneName('');
        setNewZoneColor(COLORS[0]);
        onZoneUpdate();
      } catch (error) {
        toast({ title: "Erreur", description: "Impossible d'ajouter la zone.", variant: 'destructive' });
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

            toast({ title: "Zone supprimée", description: "Les villes associées ont été désassignées.", variant: 'info' });
            onZoneUpdate();
        } catch (error) {
            console.error("Error deleting zone: ", error);
            toast({ title: "Erreur", description: "Impossible de supprimer la zone.", variant: 'destructive' });
        }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestion des Zones</CardTitle>
        <CardDescription>Créez des zones géographiques et assignez-leur une couleur pour une meilleure organisation.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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
            placeholder="Nom de la nouvelle zone (ex: Zone A, Paris Sud...)"
            value={newZoneName}
            onChange={(e) => setNewZoneName(e.target.value)}
          />
          <Button onClick={handleAddZone} disabled={isPending || !newZoneName.trim()}>
            {isPending ? <Loader2 className="animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
            Créer
          </Button>
        </div>
        <div className="border rounded-md">
            <Table>
                <TableBody>
                    {isLoadingZones ? (
                         <TableRow><TableCell className="h-24 text-center"><Loader2 className="animate-spin inline-block mr-2" /> Chargement...</TableCell></TableRow>
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
                         <TableRow><TableCell className="text-center h-24">Aucune zone créée.</TableCell></TableRow>
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
      toast({ title: "Erreur de chargement", description: "Impossible de charger les villes.", variant: 'destructive' });
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
          toast({ title: "Format invalide", description: "Veuillez utiliser le format 'Ville, Code Postal'.", variant: 'destructive' });
          return;
        }

        citiesToAdd.forEach(city => {
          const newDocRef = doc(collection(firestore, 'cities'));
          batch.set(newDocRef, city);
        });

        await batch.commit();
        toast({ title: `${citiesToAdd.length} ville(s) ajoutée(s)`, variant: 'success' });
        setNewCitiesText('');
        refreshCurrentPage();
      } catch (error) {
        console.error("Error adding cities: ", error);
        toast({ title: "Erreur", description: "Impossible d'ajouter les villes.", variant: 'destructive' });
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

        toast({ title: "Ville(s) supprimée(s)", variant: 'info' });
        setCitiesToDelete(null);
        setSelectedCityIds([]);
        refreshCurrentPage();
      } catch (error) {
        console.error("Error deleting cities: ", error);
        toast({ title: "Erreur de suppression", variant: 'destructive' });
      }
    });
  };
  
  const handleUpdateCity = async () => {
    if (!editingCity || !firestore || !editingCity.name.trim() || !editingCity.postalCode.trim()) return;

    startTransition(async () => {
      try {
        const cityRef = doc(firestore, 'cities', editingCity.id);
        await updateDoc(cityRef, { name: editingCity.name, postalCode: editingCity.postalCode });
        toast({ title: "Ville mise à jour", variant: 'success' });
        setEditingCity(null);
        refreshCurrentPage();
      } catch (error) {
        console.error("Error updating city: ", error);
        toast({ title: "Erreur", description: "Impossible de mettre à jour la ville.", variant: 'destructive' });
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
            toast({ title: "Assignation réussie", description: `${selectedCityIds.length} ville(s) déplacée(s) vers la zone.`, variant: 'success'});
            setAssignmentModalOpen(false);
            setSelectedCityIds([]);
            refreshCurrentPage();
        } catch (error) {
            console.error("Error assigning cities to zone: ", error);
            toast({ title: "Erreur d'assignation", variant: 'destructive' });
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

        <Card>
        <CardHeader>
            <CardTitle>Gestion des Villes</CardTitle>
            <CardDescription>Ajoutez, modifiez et assignez des villes à vos zones de livraison.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-2">
            <Textarea
                placeholder={"Paris, 75001\nMarseille, 13001\n(une ville par ligne, séparée par une virgule)"}
                value={newCitiesText}
                onChange={(e) => setNewCitiesText(e.target.value)}
                rows={4}
                className="flex-grow"
            />
            <Button onClick={handleAddCities} disabled={isPending || !newCitiesText.trim()} className="w-full sm:w-auto">
                {isPending ? <Loader2 className="animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                Ajouter
            </Button>
            </div>

            {selectedCityIds.length > 0 && (
            <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setAssignmentModalOpen(true)}>
                    <FolderUp className="mr-2 h-4 w-4" />
                    Déplacer ({selectedCityIds.length})
                </Button>
                <Button variant="destructive" onClick={() => setCitiesToDelete(selectedCityIds)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Supprimer ({selectedCityIds.length})
                </Button>
            </div>
            )}

            <div className="border rounded-lg overflow-hidden">
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead className="w-[50px]">
                    <Checkbox
                        checked={!!isAllSelected}
                        onCheckedChange={handleSelectAll}
                        aria-label="Tout sélectionner"
                    />
                    </TableHead>
                    <TableHead>Ville</TableHead>
                    <TableHead>Code Postal</TableHead>
                    <TableHead>Zone</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {isLoadingCities ? (
                    <TableRow><TableCell colSpan={5} className="text-center h-24"><Loader2 className="animate-spin inline-block mr-2" /> Chargement...</TableCell></TableRow>
                ) : cities && cities.length > 0 ? (
                    cities.map(city => {
                        const zone = zones?.find(z => z.id === city.zoneId);
                        return (
                            <TableRow key={city.id} data-state={selectedCityIds.includes(city.id) ? 'selected' : ''}>
                                <TableCell>
                                <Checkbox
                                    checked={selectedCityIds.includes(city.id)}
                                    onCheckedChange={(checked) => handleSelectOne(city.id, !!checked)}
                                    aria-label={`Sélectionner ${city.name}`}
                                />
                                </TableCell>
                                <TableCell>{city.name}</TableCell>
                                <TableCell>{city.postalCode}</TableCell>
                                <TableCell>{zone ? <Badge style={{ backgroundColor: zone.color, color: 'white' }}>{zone.name}</Badge> : <span className="text-muted-foreground italic">Aucune</span>}</TableCell>
                                <TableCell className="text-right">
                                <Button variant="ghost" size="icon" onClick={() => setEditingCity(city)}><FilePen className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setCitiesToDelete([city.id])}><Trash2 className="h-4 w-4" /></Button>
                                </TableCell>
                            </TableRow>
                        )
                    })
                ) : (
                    <TableRow><TableCell colSpan={5} className="text-center h-24">Aucune ville ajoutée.</TableCell></TableRow>
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
                <AlertDialogTitle>Modifier la ville</AlertDialogTitle>
                <AlertDialogDescription>
                    Modifiez le nom ou le code postal de cette ville.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-4">
                <Input
                placeholder="Nom de la ville"
                value={editingCity?.name || ''}
                onChange={(e) => setEditingCity(prev => prev ? { ...prev, name: e.target.value } : null)}
                />
                <Input
                placeholder="Code Postal"
                value={editingCity?.postalCode || ''}
                onChange={(e) => setEditingCity(prev => prev ? { ...prev, postalCode: e.target.value } : null)}
                />
            </div>
            <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction onClick={handleUpdateCity} disabled={isPending}>
                {isPending ? 'Sauvegarde...' : 'Sauvegarder'}
                </AlertDialogAction>
            </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!citiesToDelete} onOpenChange={(open) => !open && setCitiesToDelete(null)}>
            <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Êtes-vous sûr de vouloir supprimer {citiesToDelete?.length} ville(s) ?</AlertDialogTitle>
                <AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={handleDeleteCities} disabled={isPending}>
                {isPending ? 'Suppression...' : 'Supprimer'}
                </AlertDialogAction>
            </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

         {/* Zone Assignment Dialog */}
        <Dialog open={assignmentModalOpen} onOpenChange={setAssignmentModalOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Déplacer vers une zone</DialogTitle>
                    <DialogDescription>
                        Sélectionnez une zone pour y assigner les {selectedCityIds.length} ville(s) sélectionnée(s).
                    </DialogDescription>
                </DialogHeader>
                 <div className="py-4">
                    <CustomSelect
                      options={zones?.map(zone => ({ value: zone.id, label: zone.name, color: zone.color })) || []}
                      value={targetZoneId}
                      onChange={setTargetZoneId}
                      placeholder="Choisir une zone..."
                      className="w-full"
                    />
                 </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setAssignmentModalOpen(false)}>Annuler</Button>
                    <Button onClick={handleAssignToZone} disabled={isPending || !targetZoneId}>
                        {isPending ? "Déplacement..." : "Déplacer"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        </Card>
    </div>
  );
}



