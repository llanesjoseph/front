"use client";

import React from 'react';
import type { Contact } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { List, ListItem } from '@/components/ui/list';
import { Phone } from 'lucide-react';

const contacts: Contact[] = [
    { name: "Non-Emergency Police", phone: "(415) 553-0123" },
    { name: "Police (South Station Direct)", phone: "(415) 553-8090" },
    { name: "Police (Emergency)", phone: "911" },
    { name: "The East Cut (24/7)", phone: "(415) 543-8223" },
    { name: "Patrol Special Security (After 7pm)", phone: "(415) 652-4269" },
    { name: "IT", phone: "(949) 450-4388" },
    { name: "Supervisor Cell Phone (Desk Phone)", phone: "(415) 378-8180" },
    { name: "Manager/Kathy's Cell", phone: "(415) 305-5225" },
    { name: "Richard Moore Cell (Chief Engineer)", phone: "(415) 305-4214" },
];

export default function ContactsTool() {
  return (
    <div className="space-y-6">
       <header>
        <h1 className="text-3xl font-headline font-bold">Important Contacts</h1>
        <p className="text-muted-foreground">A quick reference list of essential phone numbers.</p>
      </header>
      <Card>
        <CardContent className="pt-6">
          <List>
            {contacts.map((contact, index) => (
              <ListItem key={index} className="flex justify-between items-center">
                <span className="font-medium">{contact.name}</span>
                <a href={`tel:${contact.phone}`} className="flex items-center gap-2 text-primary font-semibold hover:underline">
                  <Phone className="h-4 w-4" />
                  {contact.phone}
                </a>
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>
    </div>
  );
}

// A simple List component for styling purposes
namespace L {
    export const List = React.forwardRef<HTMLUListElement, React.HTMLAttributes<HTMLUListElement>>(({ className, ...props }, ref) => (
        <ul ref={ref} className={`space-y-4 ${className}`} {...props} />
    ));
    List.displayName = 'List';

    export const ListItem = React.forwardRef<HTMLLIElement, React.HTMLAttributes<HTMLLIElement>>(({ className, ...props }, ref) => (
        <li ref={ref} className={`p-4 border rounded-lg bg-background ${className}`} {...props} />
    ));
    ListItem.displayName = 'ListItem';
}

export { L as ListComponents };
