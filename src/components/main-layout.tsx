"use client"

import * as React from 'react';
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

type Tool = 'passOn' | 'incidentLog' | 'packageCount' | 'sendUp' | 'contacts' | 'shiftNotes' | 'downReport';

const toolConfig = {
  passOn: { icon: StickyNote, label: "Pass-On Notes", component: <PassOnNotesTool /> },
  incidentLog: { icon: ClipboardCheck, label: "Incident Log", component: <IncidentLogTool /> },
  packageCount: { icon: Package, label: "Package Count", component: <CourierTrackerTool /> },
  sendUp: { icon: ArrowUp, label: "Send-Up List", component: <SendUpListTool /> },
  contacts: { icon: BookUser, label: "Contacts", component: <ContactsTool /> },
  shiftNotes: { icon: ClipboardList, label: "Shift Notes", component: <PlaceholderTool title="Shift Notes" /> },
  downReport: { icon: TriangleAlert, label: "Down Report", component: <PlaceholderTool title="Down Report" /> },
};


export function MainLayout() {
  const [activeTool, setActiveTool] = React.useState<Tool>('passOn');

  const ActiveComponent = toolConfig[activeTool].component;

  return (
    <SidebarProvider>
      <Sidebar side="left" collapsible="icon" className="border-r">
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
          {ActiveComponent}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
