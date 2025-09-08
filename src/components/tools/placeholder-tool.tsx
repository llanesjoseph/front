"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wrench } from 'lucide-react';

interface PlaceholderToolProps {
  title: string;
}

export default function PlaceholderTool({ title }: PlaceholderToolProps) {
  return (
    <div className="flex flex-col h-full items-center justify-center text-center">
        <div className="p-6 bg-secondary rounded-full mb-4">
            <Wrench className="h-12 w-12 text-muted-foreground" />
        </div>
        <h1 className="text-3xl font-headline font-bold capitalize">{title}</h1>
        <p className="text-muted-foreground mt-2">This tool is currently under construction.</p>
        <p className="text-muted-foreground">Check back soon for updates!</p>
    </div>
  );
}
