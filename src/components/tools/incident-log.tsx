"use client"

import React, { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Incident } from '@/types';
import { parseCSVData, historicalDataCSV } from '@/lib/incident-data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import IncidentForm from './incident-form';
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, PieChart, Pie, Cell } from 'recharts';
import { Skeleton } from '../ui/skeleton';

const COLORS = ['#3498DB', '#2C3E50', '#E74C3C', '#F1C40F', '#9B59B6', '#1ABC9C', '#E67E22'];

export default function IncidentLogTool() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    const legacyData = parseCSVData(historicalDataCSV);
    const q = query(collection(db, 'incidents'), orderBy('dateObj', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const liveData: Incident[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        liveData.push({
          id: doc.id,
          ...data,
          dateObj: data.dateObj.toDate(),
        } as Incident);
      });
      
      const combined = [...liveData, ...legacyData].sort((a,b) => b.dateObj.getTime() - a.dateObj.getTime());
      setIncidents(combined);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const summaryStats = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const lastYear = currentYear - 1;
    return {
      total: incidents.length,
      thisYear: incidents.filter(inc => inc.dateObj.getFullYear() === currentYear).length,
      lastYear: incidents.filter(inc => inc.dateObj.getFullYear() === lastYear).length,
    };
  }, [incidents]);

  const monthlyData = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const lastYear = currentYear - 1;

    const data: { name: string; [key: string]: number | string }[] = [
      { name: 'Jan' }, { name: 'Feb' }, { name: 'Mar' }, { name: 'Apr' },
      { name: 'May' }, { name: 'Jun' }, { name: 'Jul' }, { name: 'Aug' },
      { name: 'Sep' }, { name: 'Oct' }, { name: 'Nov' }, { name: 'Dec' },
    ];
    
    data.forEach(month => {
        month[currentYear] = 0;
        month[lastYear] = 0;
    })

    incidents.forEach(inc => {
      const year = inc.dateObj.getFullYear();
      const month = inc.dateObj.getMonth();
      if (year === currentYear) {
        data[month][currentYear]++;
      } else if (year === lastYear) {
        data[month][lastYear]++;
      }
    });

    return data;
  }, [incidents]);

  const locationData = useMemo(() => {
    const counts: { [key: string]: number } = {};
    incidents.forEach(inc => {
      if (inc.location) {
        counts[inc.location] = (counts[inc.location] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 7); // top 7
  }, [incidents]);

  const downloadCSV = () => {
    let csv = "Date,Time Called,Time Arrived,Response Time,Incident Description,Resolution Time,Location,Resolution Description\n";
    incidents.forEach(item => {
        const dateStr = item.dateObj.toLocaleDateString("en-US");
        const respTime = item.timeCalled && item.timeArrived ? `${(new Date(item.timeArrived).getTime() - new Date(item.timeCalled).getTime()) / 60000} mins` : '-';
        const description = `"${(item.description || '').replace(/"/g, '""')}"`;
        const resolution = `"${(item.resolutionDescription || '').replace(/"/g, '""')}"`;
        const location = `"${(item.location || '').replace(/"/g, '""')}"`;
        const row = [dateStr, item.timeCalled || '', item.timeArrived || '', respTime, description, item.resolutionTime || '', location, resolution].join(",");
        csv += row + "\n";
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `incident_report_${new Date().toISOString()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  if (isLoading) {
    return (
        <div className="space-y-6">
            <Skeleton className="h-10 w-1/3" />
            <div className="grid gap-4 md:grid-cols-3">
                <Skeleton className="h-28 w-full" />
                <Skeleton className="h-28 w-full" />
                <Skeleton className="h-28 w-full" />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
                <Skeleton className="h-80 w-full" />
                <Skeleton className="h-80 w-full" />
            </div>
        </div>
    )
  }

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-headline font-bold">Incident Log</h1>
          <p className="text-muted-foreground">Dashboard for tracking and analyzing security incidents.</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Close Form' : 'New Incident Log'}
        </Button>
      </header>
      
      {showForm && <IncidentForm onSubmitted={() => setShowForm(false)} locations={Array.from(new Set(incidents.map(i => i.location).filter(Boolean) as string[]))} />}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Total Incidents</CardTitle></CardHeader>
          <CardContent><p className="text-4xl font-bold">{summaryStats.total}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>This Year's Incidents</CardTitle></CardHeader>
          <CardContent><p className="text-4xl font-bold">{summaryStats.thisYear}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Last Year's Incidents</CardTitle></CardHeader>
          <CardContent><p className="text-4xl font-bold">{summaryStats.lastYear}</p></CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Monthly Incidents</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey={new Date().getFullYear()} stroke="var(--color-chart-1)" />
                <Line type="monotone" dataKey={new Date().getFullYear() - 1} stroke="var(--color-chart-2)" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Top Incident Locations</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={locationData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                    {locationData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      
      <div>
        <Button onClick={() => setShowHistory(!showHistory)}>
          {showHistory ? 'Hide Historical Data' : 'Review Historical Data'}
        </Button>
        {showHistory && (
          <Card className="mt-4">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Historical Incident Records</CardTitle>
                <Button onClick={downloadCSV}>Download CSV</Button>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[400px]">
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead>Description</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {incidents.map((inc, index) => (
                            <TableRow key={inc.id || index}>
                            <TableCell>{inc.dateObj.toLocaleDateString()}</TableCell>
                            <TableCell>{inc.location || '-'}</TableCell>
                            <TableCell className="max-w-xs truncate">{inc.description || '-'}</TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                </ScrollArea>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
