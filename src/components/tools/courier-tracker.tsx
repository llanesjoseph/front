
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

const DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const COURIERS = [
  { id: 'amazon', name: 'Amazon' },
  { id: 'dhl', name: 'DHL/GLS' },
  { id: 'fedex-express', name: 'FedEx Express' },
  { id: 'fedex-ground', name: 'FedEx Ground' },
  { id: 'ontrac', name: 'Ontrac' },
  { id: 'ups', name: 'UPS' },
  { id: 'usps', name: 'USPS' },
];

type Counts = { [courierId: string]: { [day: string]: number } };
type ArchivedWeek = { weekStart: string; countsIncoming: Counts; countsOutgoing: Counts; };

const getWeekStartDate = (date: Date) => {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
};

const formatDate = (date: Date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

const initializeCounts = (obj: any): Counts => {
  const result: Counts = {};
  COURIERS.forEach(courier => {
    result[courier.id] = {};
    DAYS.forEach(day => {
      result[courier.id][day] = (obj && obj[courier.id] && obj[courier.id][day]) || 0;
    });
  });
  return result;
};


export default function CourierTrackerTool() {
  const [isOutgoing, setIsOutgoing] = useState(false);
  const [isManual, setIsManual] = useState(false);
  const [counts, setCounts] = useState<Counts>(initializeCounts(null));
  const [archivedWeeks, setArchivedWeeks] = useState<ArchivedWeek[]>([]);
  const [currentView, setCurrentView] = useState<'current' | number>('current');
  const [isClient, setIsClient] = useState(false);
  const { toast } = useToast();

  const loadData = useCallback(() => {
    const today = new Date();
    const weekStartStr = getWeekStartDate(today).toISOString().split('T')[0];
    const key = `courier_week_${weekStartStr}`;
    
    const savedData = localStorage.getItem(key);
    const parsedData = savedData ? JSON.parse(savedData) : { incoming: {}, outgoing: {} };
    const dataToSet = isOutgoing ? parsedData.outgoing : parsedData.incoming;
    setCounts(initializeCounts(dataToSet));
    
    const savedArchives = localStorage.getItem('courier_archives');
    setArchivedWeeks(savedArchives ? JSON.parse(savedArchives) : []);
  }, [isOutgoing]);

  useEffect(() => {
    setIsClient(true);
    loadData();
  }, [isOutgoing]);
  
  const saveData = (newCounts: Counts) => {
    if (currentView !== 'current') return;
    
    const today = new Date();
    const weekStartStr = getWeekStartDate(today).toISOString().split('T')[0];
    const key = `courier_week_${weekStartStr}`;
    
    const existingData = localStorage.getItem(key);
    const parsedData = existingData ? JSON.parse(existingData) : { incoming: {}, outgoing: {} };

    if(isOutgoing) {
        parsedData.outgoing = newCounts;
    } else {
        parsedData.incoming = newCounts;
    }

    localStorage.setItem(key, JSON.stringify(parsedData));
    setCounts(newCounts);
  };
  
  const handleCountChange = (courierId: string, day: string, value: number) => {
    const newCounts = { ...counts };
    newCounts[courierId][day] += value;
    if (newCounts[courierId][day] < 0) newCounts[courierId][day] = 0;
    saveData(newCounts);
  };
  
  const handleManualSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const newCounts = {...counts};
    const currentDay = DAYS[new Date().getDay()];
    let updated = false;

    COURIERS.forEach(courier => {
      const input = (e.currentTarget.elements.namedItem(courier.id) as HTMLInputElement);
      if (input) {
        const val = parseInt(input.value, 10);
        if (val > 0) {
          newCounts[courier.id][currentDay] = (newCounts[courier.id][currentDay] || 0) + val;
          input.value = '';
          updated = true;
        }
      }
    });
    if (updated) {
      saveData(newCounts);
      toast({title: 'Success', description: 'Manual counts added.'});
    }
  };

  const archiveWeek = () => {
    if(!confirm("Are you sure you want to archive the current week's data? This will reset the current week.")) return;

    const today = new Date();
    const weekStart = getWeekStartDate(today);
    const weekStartStr = weekStart.toISOString().split('T')[0];

    const key = `courier_week_${weekStartStr}`;
    const dataToArchive = localStorage.getItem(key);
    if (!dataToArchive) {
        toast({variant: 'destructive', title: 'Error', description: 'No data to archive for the current week.'});
        return;
    }

    const newArchive: ArchivedWeek = {
        weekStart: weekStartStr,
        ...JSON.parse(dataToArchive)
    };

    const newArchives = [newArchive, ...archivedWeeks];
    localStorage.setItem('courier_archives', JSON.stringify(newArchives));
    localStorage.removeItem(key);
    
    setArchivedWeeks(newArchives);
    setCounts(initializeCounts(null));
    setCurrentView('current');
    toast({title: 'Success', description: 'Week archived successfully.'});
  };

  useEffect(() => {
    if (currentView === 'current') {
      loadData();
    } else {
      const archive = archivedWeeks[currentView];
      if (archive) {
        setCounts(isOutgoing ? initializeCounts(archive.countsOutgoing) : initializeCounts(archive.countsIncoming));
      }
    }
  }, [currentView, isOutgoing, archivedWeeks, loadData]);

  if (!isClient) {
    return null;
  }

  const displayedCounts = counts;
  const currentDayIndex = new Date().getDay();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-headline font-bold">Daily Courier Tracker</h1>
        <p className="text-muted-foreground">Track incoming and outgoing packages for all couriers.</p>
      </header>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>
            {currentView === 'current' ? `Current Week` : `Archived: ${archivedWeeks[currentView as number]?.weekStart}`}
          </CardTitle>
          <div className="flex items-center gap-4">
            <Select value={currentView.toString()} onValueChange={(val) => setCurrentView(val === 'current' ? 'current' : parseInt(val))}>
                <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="View an archive" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="current">Current Week</SelectItem>
                    {archivedWeeks.map((archive, index) => {
                        const startDate = new Date(archive.weekStart);
                        const endDate = new Date(startDate);
                        endDate.setDate(startDate.getDate() + 6);
                        return <SelectItem key={index} value={index.toString()}>{`${formatDate(startDate)} - ${formatDate(endDate)}`}</SelectItem>
                    })}
                </SelectContent>
            </Select>
            <Button onClick={archiveWeek} variant="outline" disabled={currentView !== 'current'}>Archive Week</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 mb-4">
            <div className="flex items-center space-x-2">
              <Switch id="mode-toggle" checked={isOutgoing} onCheckedChange={setIsOutgoing} />
              <Label htmlFor="mode-toggle">{isOutgoing ? 'Outgoing' : 'Incoming'}</Label>
            </div>
             <div className="flex items-center space-x-2">
              <Switch id="manual-toggle" checked={isManual} onCheckedChange={setIsManual} disabled={currentView !== 'current'} />
              <Label htmlFor="manual-toggle">Manual Input</Label>
            </div>
          </div>
          
          <form onSubmit={handleManualSubmit}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Courier</TableHead>
                  {DAYS.map(day => <TableHead key={day} className="capitalize">{day}</TableHead>)}
                  <TableHead>Weekly</TableHead>
                  <TableHead className={currentView !== 'current' ? 'invisible' : ''}>Adjust</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {COURIERS.map(courier => {
                  const weeklyTotal = Object.values(displayedCounts[courier.id] || {}).reduce((a, b) => a + b, 0);
                  return (
                    <TableRow key={courier.id}>
                      <TableCell className="font-medium">{courier.name}</TableCell>
                      {DAYS.map((day, i) => (
                        <TableCell key={day} className={i === currentDayIndex ? 'bg-secondary' : ''}>
                          {isManual && currentView === 'current' && i === currentDayIndex ?
                            <Input type="number" name={courier.id} className="w-20" min="0" placeholder={(displayedCounts[courier.id]?.[day] || 0).toString()} /> :
                            (displayedCounts[courier.id]?.[day] || 0)}
                        </TableCell>
                      ))}
                      <TableCell className="font-bold">{weeklyTotal}</TableCell>
                      <TableCell className={currentView !== 'current' ? 'invisible' : ''}>
                        <div className="flex gap-1">
                            <Button size="icon" variant="ghost" onClick={() => handleCountChange(courier.id, DAYS[currentDayIndex], 1)} disabled={isManual}>+</Button>
                            <Button size="icon" variant="ghost" onClick={() => handleCountChange(courier.id, DAYS[currentDayIndex], -1)} disabled={isManual}>-</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            {isManual && currentView === 'current' && (
              <div className="mt-4 flex justify-end">
                <Button type="submit">Add Manual Counts</Button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

    