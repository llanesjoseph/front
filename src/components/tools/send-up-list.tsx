"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Trash2, Printer } from 'lucide-react';
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

const LOCAL_STORAGE_KEY = 'sendUpLists';

const naturalCompare = (a: string, b: string) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });

export default function SendUpListTool() {
  const [listDefs, setListDefs] = useState<ListDefinition[]>(BUILT_INS);
  const [lists, setLists] = useState<ListData>({});
  const [newListItem, setNewListItem] = useState<{ [id: string]: string }>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    try {
      const savedLists = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedLists) {
        const parsedLists: ListData = JSON.parse(savedLists);
        // Ensure all list definitions exist in the loaded data
        const allLists: ListData = {};
        listDefs.forEach(def => {
          allLists[def.id] = (parsedLists[def.id] || []).sort(naturalCompare);
        });
        setLists(allLists);
      } else {
        // Initialize with empty lists if nothing in storage
        const emptyLists: ListData = {};
        listDefs.forEach(def => {
          emptyLists[def.id] = [];
        });
        setLists(emptyLists);
      }
    } catch (e) {
      console.error("Failed to load send-up lists from localStorage", e);
    }
    setIsLoading(false);
  }, [listDefs]);

  const updateAndSaveLists = (newLists: ListData) => {
    setLists(newLists);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newLists));
  };


  const handleModify = (action: 'add' | 'remove', listId: string, value: string) => {
    if (!value) return;
    const currentList = lists[listId] || [];
    let newList;
    if (action === 'add' && !currentList.includes(value)) {
      newList = [...currentList, value].sort(naturalCompare);
    } else {
      newList = currentList.filter(item => item !== value);
    }
    
    updateAndSaveLists({ ...lists, [listId]: newList });
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
