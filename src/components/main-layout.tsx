"use client"

import * as React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarInset,
} from '@/components/ui/sidebar';
import type { LucideIcon } from 'lucide-react';
import {
  ClipboardList,
  Package,
  ArrowUp,
  TriangleAlert,
  BookUser,
  ClipboardCheck,
  StickyNote,
  Building,
} from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import PassOnNotesTool from './tools/pass-on-notes';
import IncidentLogTool from './tools/incident-log';
import CourierTrackerTool from './tools/courier-tracker';
import SendUpListTool from './tools/send-up-list';
import ContactsTool from './tools/contacts';
import PlaceholderTool from './tools/placeholder-tool';
import ShiftNotesTool from './tools/shift-notes';

type Tool = 'passOn' | 'incidentLog' | 'packageCount' | 'sendUp' | 'contacts' | 'shiftNotes' | 'downReport';

const toolConfig: Record<
  Tool,
  { icon: LucideIcon; label: string; description: string; component: React.ReactNode }
> = {
  passOn: {
    icon: StickyNote,
    label: "Pass-On Notes",
    description: "Real-time notes for shift handovers",
    component: <PassOnNotesTool />,
  },
  incidentLog: {
    icon: ClipboardCheck,
    label: "Incident Log",
    description: "Record and review security incidents",
    component: <IncidentLogTool />,
  },
  packageCount: {
    icon: Package,
    label: "Package Count",
    description: "Track incoming packages and deliveries",
    component: <CourierTrackerTool />,
  },
  sendUp: {
    icon: ArrowUp,
    label: "Send-Up List",
    description: "Manage items awaiting pickup",
    component: <SendUpListTool />,
  },
  contacts: {
    icon: BookUser,
    label: "Contacts",
    description: "Quick reference for important numbers",
    component: <ContactsTool />,
  },
  shiftNotes: {
    icon: ClipboardList,
    label: "Shift Notes",
    description: "Document daily shift activities",
    component: <ShiftNotesTool />,
  },
  downReport: {
    icon: TriangleAlert,
    label: "Down Report",
    description: "Report system downtime or issues",
    component: <PlaceholderTool title="Down Report" />,
  },
};


export function MainLayout() {
  const [activeTool, setActiveTool] = React.useState<Tool>('passOn');

  const ActiveComponent = toolConfig[activeTool].component;
  const activeLabel = toolConfig[activeTool].label;
  const activeDescription = toolConfig[activeTool].description;

  return (
    <SidebarProvider>
      <Sidebar
        side="left"
        collapsible="icon"
        className="border-r bg-sidebar-background"
      >
        <SidebarHeader>
          <div className="flex items-center gap-2 p-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Building className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="font-headline text-lg font-semibold text-sidebar-foreground group-data-[collapsible=icon]:hidden">
              Front Desk Nexus
            </h1>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {Object.keys(toolConfig).map((key) => {
              const tool = toolConfig[key as Tool];
              return (
                <SidebarMenuItem key={key}>
                  <SidebarMenuButton
                    onClick={() => setActiveTool(key as Tool)}
                    isActive={activeTool === key}
                    tooltip={{ children: tool.label, side: "right" }}
                  >
                    <tool.icon />
                    <span>{tool.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
            <div className="flex items-center justify-center p-2 group-data-[collapsible=icon]:justify-center">
                 <ThemeToggle />
            </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <div className="h-full min-h-screen p-4 md:p-6 lg:p-8 bg-background">
          <div className="mb-6 rounded-xl bg-gradient-to-r from-primary to-accent p-4 text-primary-foreground shadow">
            <h2 className="text-2xl font-headline font-bold">{activeLabel}</h2>
            <p className="text-sm opacity-90">{activeDescription}</p>
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTool}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {ActiveComponent}
            </motion.div>
          </AnimatePresence>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
