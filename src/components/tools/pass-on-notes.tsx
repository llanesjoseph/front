"use client";

import React, { useState, useEffect } from 'react';
import type { PassOnNote, Urgency } from '@/types';
import { PassOnNoteCard } from './pass-on-note-card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { usePersistentState } from '@/lib/use-persistent-state';

const urgencyOrder: Record<Urgency, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

const LOCAL_STORAGE_KEY = 'passOnNotes';

export default function PassOnNotesTool() {
  const [notes, setNotes, ready] = usePersistentState<PassOnNote[]>(LOCAL_STORAGE_KEY, []);
  const [newNote, setNewNote] = useState('');
  const [filter, setFilter] = useState<'all' | Urgency>('all');
  const isLoading = !ready;

  useEffect(() => {
    if (!ready) return;
    setNotes((existing) => {
      const parsed = existing.map((n) => ({
        ...n,
        timestamp: n.timestamp ? new Date(n.timestamp as any) : new Date(),
      }));
      parsed.sort(
        (a, b) =>
          (urgencyOrder[b.urgency] || 0) - (urgencyOrder[a.urgency] || 0) ||
          b.timestamp.getTime() - a.timestamp.getTime()
      );
      return parsed;
    });
  }, [ready, setNotes]);

  const updateNotes = (updatedNotes: PassOnNote[]) => {
    updatedNotes.sort(
      (a, b) =>
        (urgencyOrder[b.urgency] || 0) - (urgencyOrder[a.urgency] || 0) ||
        b.timestamp.getTime() - a.timestamp.getTime()
    );
    setNotes(updatedNotes);
  };

  const handleAddNote = () => {
    if (newNote.trim() === '') return;
    const newNoteObject: PassOnNote = {
      id: new Date().toISOString(),
      text: newNote.trim(),
      urgency: 'low',
      timestamp: new Date(),
      completed: false,
    };
    updateNotes([newNoteObject, ...notes]);
    setNewNote('');
  };

  const handleNoteUpdate = (updatedNote: PassOnNote) => {
    const noteIndex = notes.findIndex(n => n.id === updatedNote.id);
    if (noteIndex > -1) {
      const newNotes = [...notes];
      newNotes[noteIndex] = updatedNote;
      updateNotes(newNotes);
    }
  };

  const handleNoteDelete = (noteId: string) => {
    updateNotes(notes.filter(n => n.id !== noteId));
  };


  return (
    <div className="flex flex-col h-full gap-6">
      <header className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-headline font-bold">Pass-On Notes</h1>
          <p className="text-muted-foreground">Real-time notes for shift handovers (Local Storage).</p>
        </div>
        <Select value={filter} onValueChange={(value) => setFilter(value as any)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
      </header>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, index) => (
                  <Card key={index}><CardContent className="p-6"><Skeleton className="h-24 w-full" /></CardContent></Card>
                ))
              ) : notes.filter(n => filter === 'all' || n.urgency === filter).length > 0 ? (
                notes
                  .filter(n => filter === 'all' || n.urgency === filter)
                  .map((note) => (
                  <PassOnNoteCard
                    key={note.id}
                    note={note}
                    onUpdate={handleNoteUpdate}
                    onDelete={handleNoteDelete}
                  />
                  ))
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
