"use client";

import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, orderBy, query, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { PassOnNote, Urgency } from '@/types';
import { PassOnNoteCard } from './pass-on-note-card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const urgencyOrder: Record<Urgency, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

export default function PassOnNotesTool() {
  const [notes, setNotes] = useState<PassOnNote[]>([]);
  const [newNote, setNewNote] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'passOnNotes'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const notesData: PassOnNote[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (!data.completed) {
          notesData.push({ id: doc.id, ...data } as PassOnNote);
        }
      });
      
      notesData.sort((a, b) => (urgencyOrder[b.urgency] || 0) - (urgencyOrder[a.urgency] || 0));
      setNotes(notesData);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAddNote = async () => {
    if (newNote.trim() === '') return;
    try {
      await addDoc(collection(db, 'passOnNotes'), {
        text: newNote.trim(),
        urgency: 'low',
        timestamp: serverTimestamp(),
        completed: false,
      });
      setNewNote('');
    } catch (error) {
      console.error("Error adding pass-on note:", error);
    }
  };

  return (
    <div className="flex flex-col h-full gap-6">
      <header>
        <h1 className="text-3xl font-headline font-bold">Pass-On Notes</h1>
        <p className="text-muted-foreground">Real-time notes for shift handovers.</p>
      </header>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, index) => (
                  <Card key={index}><CardContent className="p-6"><Skeleton className="h-24 w-full" /></CardContent></Card>
                ))
              ) : notes.length > 0 ? (
                notes.map((note) => <PassOnNoteCard key={note.id} note={note} />)
              ) : (
                <div className="md:col-span-2 lg:col-span-3 text-center py-10">
                  <p className="text-muted-foreground">No active pass-on notes.</p>
                </div>
              )}
            </div>
        </div>

        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Add New Note</CardTitle>
              <CardDescription>Add a new note for the next shift.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                id="passOnInput"
                placeholder="Type your note here..."
                rows={4}
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="w-full"
              />
              <Button onClick={handleAddNote} className="w-full">
                <Plus className="mr-2 h-4 w-4" /> Add Note
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
