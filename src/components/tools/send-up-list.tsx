"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { collection, doc, getDoc, setDoc, onSnapshot, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Trash2, Printer } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Skeleton } from '../ui/skeleton';

interface ListDefinition {
  id: string;
  name: string;
  cols: number;
}

interface ListData {
  [id: string]: string[];
}

const BUILT_INS: ListDefinition[] = [
  { id: 'tower', name: 'Tower List', cols: 8 },
  { id: 'wee', name: 'Wee! List', cols: 2 },
  { id: 'podium', name: 'Podium List', cols: 6 },
  { id: 'goodeggs', name: 'Good Eggs List', cols: 2 },
];

const naturalCompare = (a: string, b: string) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });

export default function SendUpListTool() {
  const [listDefs, setListDefs] = useState<ListDefinition[]>([]);
  const [lists, setLists] = useState<ListData>({});
  const [newListItem, setNewListItem] = useState<{ [id: string]: string }>({});
  const [isLoading, setIsLoading] = useState(true);

  const loadListDefs = useCallback(async () => {
    const docRef = doc(db, 'sendUp', 'listDefinitions');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      setListDefs(docSnap.data().defs);
    } else {
      await setDoc(docRef, { defs: BUILT_INS });
      setListDefs(BUILT_INS);
    }
  }, []);

  useEffect(() => {
    loadListDefs();
  }, [loadListDefs]);

  useEffect(() => {
    if (listDefs.length === 0) return;

    const unsubscribes = listDefs.map(def => {
      return onSnapshot(doc(db, 'sendUpLists', def.id), (docSnap) => {
        const values = docSnap.exists() ? docSnap.data().values || [] : [];
        setLists(prev => ({ ...prev, [def.id]: values.sort(naturalCompare) }));
      });
    });

    setIsLoading(false);
    return () => unsubscribes.forEach(unsub => unsub());
  }, [listDefs]);

  const handleModify = async (action: 'add' | 'remove', listId: string, value: string) => {
    if (!value) return;
    const currentList = lists[listId] || [];
    let newList;
    if (action === 'add' && !currentList.includes(value)) {
      newList = [...currentList, value];
    } else {
      newList = currentList.filter(item => item !== value);
    }
    await setDoc(doc(db, 'sendUpLists', listId), { values: newList.sort(naturalCompare) });
    setNewListItem(prev => ({...prev, [listId]: ''}));
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 printable-area">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .printable-area, .printable-area * { visibility: visible; }
          .printable-area { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none; }
        }
      `}</style>
      <header className="flex justify-between items-start no-print">
        <div>
          <h1 className="text-3xl font-headline font-bold">Send-Up Lists</h1>
          <p className="text-muted-foreground">Manage and print food delivery lists for all units.</p>
        </div>
        <Button onClick={handlePrint}><Printer className="mr-2 h-4 w-4" /> Print</Button>
      </header>

      {isLoading ? (
         <div className="grid md:grid-cols-2 gap-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
         </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
            {listDefs.map(def => (
                <Card key={def.id}>
                <CardHeader>
                    <CardTitle>{def.name}</CardTitle>
                    <CardDescription>Units to send deliveries up to.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableBody>
                        {(lists[def.id] || []).reduce<string[][]>((acc, item, index) => {
                            const chunkIndex = Math.floor(index / def.cols);
                            if (!acc[chunkIndex]) acc[chunkIndex] = [];
                            acc[chunkIndex].push(item);
                            return acc;
                        }, []).map((row, rowIndex) => (
                            <TableRow key={rowIndex}>
                            {row.map((item, itemIndex) => (
                                <TableCell key={itemIndex} className="font-semibold text-center">
                                    <div className="flex items-center justify-center gap-2 group">
                                        {item}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 opacity-0 group-hover:opacity-100 no-print"
                                            onClick={() => handleModify('remove', def.id, item)}
                                        >
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
                                </TableCell>
                            ))}
                            {/* Fill empty cells */}
                            {Array(def.cols - row.length).fill(0).map((_, i) => <TableCell key={`empty-${i}`} />)}
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                    <div className="mt-4 flex gap-2 no-print">
                        <Input 
                            placeholder="Add unit..." 
                            value={newListItem[def.id] || ''}
                            onChange={e => setNewListItem(prev => ({...prev, [def.id]: e.target.value}))}
                            onKeyDown={e => e.key === 'Enter' && handleModify('add', def.id, (newListItem[def.id] || ''))}
                        />
                        <Button onClick={() => handleModify('add', def.id, (newListItem[def.id] || ''))}><PlusCircle className="h-4 w-4" /></Button>
                    </div>
                </CardContent>
                </Card>
            ))}
        </div>
      )}
    </div>
  );
}