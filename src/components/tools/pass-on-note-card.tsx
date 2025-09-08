"use client"

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { PassOnNote, Urgency } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { GripVertical, Trash2, Edit } from 'lucide-react';


const urgencyStyles: Record<Urgency, { bg: string, border: string, text: string }> = {
    low: { bg: 'bg-green-100 dark:bg-green-900/50', border: 'border-green-500', text: 'text-green-700 dark:text-green-300' },
    medium: { bg: 'bg-yellow-100 dark:bg-yellow-900/50', border: 'border-yellow-500', text: 'text-yellow-700 dark:text-yellow-300' },
    high: { bg: 'bg-red-100 dark:bg-red-900/50', border: 'border-red-500', text: 'text-red-700 dark:text-red-300' },
};

export function PassOnNoteCard({ note }: { note: PassOnNote }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editedText, setEditedText] = useState(note.text);
  const { toast } = useToast();

  const handleUpdatePriority = async (newPriority: Urgency) => {
    const noteRef = doc(db, 'passOnNotes', note.id);
    try {
      await updateDoc(noteRef, { urgency: newPriority });
      toast({ title: "Priority Updated", description: "The note's priority has been changed." });
    } catch (error) {
      console.error("Error updating priority:", error);
      toast({ variant: "destructive", title: "Update Failed", description: "Could not update the priority." });
    }
  };

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this note?")) {
      const noteRef = doc(db, 'passOnNotes', note.id);
      try {
        await deleteDoc(noteRef);
        toast({ title: "Note Deleted", description: "The note has been successfully deleted." });
      } catch (error) {
        console.error("Error deleting note:", error);
        toast({ variant: "destructive", title: "Delete Failed", description: "Could not delete the note." });
      }
    }
  };

  const handleEdit = async () => {
    if (editedText.trim() === '') return;
    const noteRef = doc(db, 'passOnNotes', note.id);
    try {
      await updateDoc(noteRef, { text: editedText.trim() });
      toast({ title: "Note Updated", description: "The note has been successfully edited." });
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error("Error editing note:", error);
      toast({ variant: "destructive", title: "Edit Failed", description: "Could not edit the note." });
    }
  }

  const cardDate = note.timestamp && note.timestamp.seconds ? formatDistanceToNow(new Date(note.timestamp.seconds * 1000), { addSuffix: true }) : 'just now';

  return (
    <Card className={cn("flex flex-col justify-between transition-all duration-300", urgencyStyles[note.urgency].bg, urgencyStyles[note.urgency].border)}>
      <div onClick={() => setIsExpanded(!isExpanded)} className="cursor-pointer">
        <CardHeader>
          <CardTitle className="flex justify-between items-start">
            <span className={cn("text-sm font-semibold uppercase tracking-wider", urgencyStyles[note.urgency].text)}>
              {note.urgency} Priority
            </span>
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">{cardDate}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-foreground">{note.text}</p>
        </CardContent>
      </div>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <CardFooter className="flex-col items-start gap-4 pt-4 border-t">
              <div className="w-full">
                <label className="text-sm font-medium">Set Priority</label>
                <Select defaultValue={note.urgency} onValueChange={(value: Urgency) => handleUpdatePriority(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Change priority..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex w-full gap-2">
                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full">
                      <Edit className="mr-2 h-4 w-4" /> Edit
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit Note</DialogTitle>
                    </DialogHeader>
                    <Textarea value={editedText} onChange={(e) => setEditedText(e.target.value)} rows={5} />
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="ghost">Cancel</Button>
                      </DialogClose>
                      <Button onClick={handleEdit}>Save Changes</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <Button variant="destructive" onClick={handleDelete} className="w-full">
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </Button>
              </div>
            </CardFooter>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
