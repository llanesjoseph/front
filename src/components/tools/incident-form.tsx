"use client"

import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { suggestIncidentLocation } from '@/ai/flows/suggest-incident-location';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Wand2, Loader2 } from 'lucide-react';

const formSchema = z.object({
  startTime: z.string().min(1, 'Start time is required.'),
  arrivalTime: z.string().optional(),
  description: z.string().min(1, 'Description is required.'),
  location: z.string().min(1, 'Location is required.'),
  customLocation: z.string().optional(),
  resolutionTime: z.string().optional(),
  resolutionDescription: z.string().optional(),
}).refine(data => data.location !== 'Custom' || (data.location === 'Custom' && data.customLocation), {
  message: "Custom location cannot be empty",
  path: ["customLocation"],
});

type IncidentFormProps = {
    onSubmitted: () => void;
    locations: string[];
}

export default function IncidentForm({ onSubmitted, locations }: IncidentFormProps) {
  const [isSuggesting, setIsSuggesting] = useState(false);
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: "",
      location: "",
      customLocation: "",
      startTime: "",
      arrivalTime: "",
      resolutionTime: "",
      resolutionDescription: "",
    },
  });

  const watchLocation = form.watch('location');
  const watchDescription = form.watch('description');

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const location = values.location === 'Custom' ? values.customLocation : values.location;

    try {
      await addDoc(collection(db, 'incidents'), {
        dateObj: new Date(values.startTime),
        timeCalled: values.startTime,
        timeArrived: values.arrivalTime,
        description: values.description,
        location: location,
        resolutionTime: values.resolutionTime,
        resolutionDescription: values.resolutionDescription,
        timestamp: serverTimestamp(),
      });
      toast({ title: 'Success', description: 'Incident logged successfully.' });
      form.reset();
      onSubmitted();
    } catch (error) {
      console.error("Error submitting incident:", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to log incident.' });
    }
  }
  
  const handleSuggestLocation = async () => {
    if (!watchDescription) {
        toast({ variant: 'destructive', title: 'Error', description: 'Please enter an incident description first.' });
        return;
    }
    setIsSuggesting(true);
    try {
        const result = await suggestIncidentLocation({ incidentDescription: watchDescription });
        const suggested = result.suggestedLocation;
        if (locations.includes(suggested) || suggested === 'Custom') {
            form.setValue('location', suggested);
        } else {
            form.setValue('location', 'Custom');
            form.setValue('customLocation', suggested);
        }
        toast({ title: 'Suggestion applied!', description: `AI suggested location: ${suggested}` });
    } catch (error) {
        console.error("AI Suggestion Error:", error);
        toast({ variant: 'destructive', title: 'AI Error', description: 'Could not get suggestion.' });
    } finally {
        setIsSuggesting(false);
    }
  }
  
  const uniqueLocations = ["Custom", ...new Set(locations)];

  return (
    <Card>
      <CardHeader>
        <CardTitle>New Incident Log Form</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Time</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="arrivalTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Security Arrival Time</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Incident Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe the incident..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex items-end gap-2">
                <div className="flex-grow">
                    <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Location</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a location" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            {uniqueLocations.map(loc => <SelectItem key={loc} value={loc}>{loc}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </div>
                <Button type="button" variant="outline" onClick={handleSuggestLocation} disabled={isSuggesting || !watchDescription}>
                    {isSuggesting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                    <span className="ml-2">Suggest</span>
                </Button>
            </div>
            {watchLocation === 'Custom' && (
              <FormField
                control={form.control}
                name="customLocation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custom Location</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter custom location" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
             <div className="grid md:grid-cols-2 gap-6">
                <FormField
                    control={form.control}
                    name="resolutionTime"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Resolution Time</FormLabel>
                        <FormControl>
                        <Input type="datetime-local" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            </div>
            <FormField
              control={form.control}
              name="resolutionDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Resolution Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe how the incident was resolved..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit">Submit Incident</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
