"use client"

import React, { useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '../ui/skeleton';
import { useToast } from '@/hooks/use-toast';

// Default tasks and categories
const DEFAULT_TASKS = {
    "Operations": [
        "Exterior Round with Intercom Check", "Podium Stairwell #6 Round", "Podium Round", "Tower Round",
        "41st & 42nd floor check #1", "41st & 42nd floor check #2", "Called 706 About Roof Inspection",
        "Down Reports", "Weekly P.E."
    ],
    "Amenities": [
        "Gym t.v. ON", "Gym t.v. OFF", "5th Floor Amenities Door OPEN", "5th Floor Amenities Door CLOSED",
        "5th Floor Amenities Round", "Amenities Reservations Completed/Processed"
    ],
    "Packages": [
        "Key Audit", "Podium Package Audit #1", "Podium Package Audit #2", "Tower Package Audit #1",
        "Tower Package Audit #2", "Outgoing Package Audit", "Gym Audit"
    ]
};

type TaskState = {
    assignments: string[];
    timestamp: string;
    completed: boolean;
};

type ShiftData = {
    teamMembers: string[];
    townshipMembers: string[];
    tasksState: { [taskName: string]: TaskState };
    notes: any[];
    selectedTeam: 'Days' | 'Swing' | 'Grave';
};


export default function ShiftNotesTool() {
    const [isLoading, setIsLoading] = useState(true);
    const [shiftData, setShiftData] = useState<ShiftData>({
        teamMembers: [],
        townshipMembers: [],
        tasksState: {},
        notes: [],
        selectedTeam: 'Days'
    });

    const [newTeamMember, setNewTeamMember] = useState('');
    const [newTownshipMember, setNewTownshipMember] = useState('');
    const [editTeam, setEditTeam] = useState(false);
    const [editTownship, setEditTownship] = useState(false);
    const { toast } = useToast();

    const allTasks = Object.values(DEFAULT_TASKS).flat();

    const saveData = useCallback(async (data: ShiftData) => {
        try {
            await setDoc(doc(db, 'shiftNotes', 'current'), data, { merge: true });
        } catch (error) {
            console.error("Error saving shift data:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to save shift data.' });
        }
    }, [toast]);
    
    useEffect(() => {
        const docRef = doc(db, 'shiftNotes', 'current');
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data() as ShiftData;
                // Ensure tasksState is valid
                const validTasksState: { [taskName: string]: TaskState } = {};
                allTasks.forEach(task => {
                    validTasksState[task] = data.tasksState?.[task] || { assignments: [''], timestamp: '--:--', completed: false };
                });
                data.tasksState = validTasksState;
                setShiftData(data);
            } else {
                // Initialize with default structure
                const initialTasksState: { [taskName: string]: TaskState } = {};
                allTasks.forEach(task => {
                    initialTasksState[task] = { assignments: [''], timestamp: '--:--', completed: false };
                });
                setShiftData(prev => ({...prev, tasksState: initialTasksState }));
            }
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, [allTasks]);


    const handleAddTeamMember = () => {
        if (newTeamMember && !shiftData.teamMembers.includes(newTeamMember)) {
            const updatedData = { ...shiftData, teamMembers: [...shiftData.teamMembers, newTeamMember] };
            setShiftData(updatedData);
            saveData(updatedData);
            setNewTeamMember('');
        }
    };
    
    const handleAddTownshipMember = () => {
        if (newTownshipMember && !shiftData.townshipMembers.includes(newTownshipMember)) {
            const updatedData = { ...shiftData, townshipMembers: [...shiftData.townshipMembers, newTownshipMember] };
            setShiftData(updatedData);
            saveData(updatedData);
            setNewTownshipMember('');
        }
    };

    const handleTeamMemberUpdate = (index: number, value: string) => {
        const updatedMembers = [...shiftData.teamMembers];
        if(value.trim() === '') {
            updatedMembers.splice(index, 1);
        } else {
            updatedMembers[index] = value;
        }
        const updatedData = { ...shiftData, teamMembers: updatedMembers };
        setShiftData(updatedData);
        saveData(updatedData);
    };

    const handleTownshipMemberUpdate = (index: number, value: string) => {
        const updatedMembers = [...shiftData.townshipMembers];
        if(value.trim() === '') {
            updatedMembers.splice(index, 1);
        } else {
            updatedMembers[index] = value;
        }
        const updatedData = { ...shiftData, townshipMembers: updatedMembers };
        setShiftData(updatedData);
        saveData(updatedData);
    };

    const handleSetTeam = (team: 'Days' | 'Swing' | 'Grave') => {
        const updatedData = { ...shiftData, selectedTeam: team };
        setShiftData(updatedData);
        saveData(updatedData);
    };
    
    const handleTaskAssignmentChange = (taskName: string, assignmentIndex: number, assignee: string) => {
        const newTasksState = { ...shiftData.tasksState };
        const finalAssignee = assignee === 'unassigned' ? '' : assignee;
        newTasksState[taskName].assignments[assignmentIndex] = finalAssignee;
        const updatedData = { ...shiftData, tasksState: newTasksState };
        setShiftData(updatedData);
        saveData(updatedData);
    };

    const handleCompleteTask = (taskName: string) => {
        const newTasksState = { ...shiftData.tasksState };
        newTasksState[taskName].completed = true;
        newTasksState[taskName].timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const updatedData = { ...shiftData, tasksState: newTasksState };
        setShiftData(updatedData);
        saveData(updatedData);
    };

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-10 w-1/3" />
                <div className="grid gap-4 md:grid-cols-2">
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-48 w-full" />
                </div>
                <Skeleton className="h-96 w-full" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <header className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-headline font-bold">Shift Notes</h1>
                    <p className="text-muted-foreground">Live dashboard for shift handovers and task tracking.</p>
                </div>
                <Button variant="destructive">Reset Shift</Button>
            </header>

            <div className="grid md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Team Roster</CardTitle>
                        <div className="flex items-center space-x-2 pt-2">
                            <Label htmlFor="shiftSelector">Team:</Label>
                            <Select value={shiftData.selectedTeam} onValueChange={handleSetTeam}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Select shift" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Days">Days</SelectItem>
                                    <SelectItem value="Swing">Swing</SelectItem>
                                    <SelectItem value="Grave">Grave</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2 mb-4">
                            <Input placeholder="Enter team member name" value={newTeamMember} onChange={(e) => setNewTeamMember(e.target.value)} />
                            <Button onClick={handleAddTeamMember}>Add</Button>
                            <div className="flex items-center space-x-2">
                                <Switch id="edit-team" checked={editTeam} onCheckedChange={setEditTeam} />
                                <Label htmlFor="edit-team">Edit</Label>
                            </div>
                        </div>
                        <ul className="space-y-2">
                           {shiftData.teamMembers.map((member, index) => (
                                <li key={index}>
                                    {editTeam ? (
                                        <Input value={member} onBlur={(e) => handleTeamMemberUpdate(index, e.target.value)} />
                                    ) : (
                                        <p className="p-2">{member}</p>
                                    )}
                                </li>
                           ))}
                        </ul>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Township</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2 mb-4">
                            <Input placeholder="Enter township name" value={newTownshipMember} onChange={(e) => setNewTownshipMember(e.target.value)} />
                            <Button onClick={handleAddTownshipMember}>Add</Button>
                             <div className="flex items-center space-x-2">
                                <Switch id="edit-township" checked={editTownship} onCheckedChange={setEditTownship} />
                                <Label htmlFor="edit-township">Edit</Label>
                            </div>
                        </div>
                        <ul className="space-y-2">
                           {shiftData.townshipMembers.map((member, index) => (
                                <li key={index}>
                                    {editTownship ? (
                                         <Input value={member} onBlur={(e) => handleTownshipMemberUpdate(index, e.target.value)} />
                                    ) : (
                                        <p className="p-2">{member}</p>
                                    )}
                                </li>
                           ))}
                        </ul>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader><CardTitle>Tasks</CardTitle></CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Task</TableHead>
                                <TableHead>Assigned To</TableHead>
                                <TableHead>Time Completed</TableHead>
                                <TableHead>Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {Object.entries(DEFAULT_TASKS).map(([category, tasks]) => (
                                <React.Fragment key={category}>
                                    <TableRow>
                                        <TableCell colSpan={4} className="font-bold bg-secondary">{category}</TableCell>
                                    </TableRow>
                                    {tasks.map(task => {
                                        const taskState = shiftData.tasksState[task] || { assignments: [''], timestamp: '--:--', completed: false };
                                        return (
                                            <TableRow key={task} className={taskState.completed ? 'bg-green-100 dark:bg-green-900/30' : ''}>
                                                <TableCell>{task}</TableCell>
                                                <TableCell>
                                                    <Select value={taskState.assignments[0] || 'unassigned'} onValueChange={(value) => handleTaskAssignmentChange(task, 0, value)}>
                                                        <SelectTrigger><SelectValue placeholder="Assign..." /></SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="unassigned">Unassigned</SelectItem>
                                                            {shiftData.teamMembers.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                                                        </SelectContent>
                                                    </Select>
                                                </TableCell>
                                                <TableCell>{taskState.timestamp}</TableCell>
                                                <TableCell>
                                                    <Button size="sm" onClick={() => handleCompleteTask(task)} disabled={taskState.completed}>
                                                        Complete
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </React.Fragment>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

        </div>
    );
}
