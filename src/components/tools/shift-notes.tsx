"use client"

import React, { useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '../ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter, SheetClose } from '@/components/ui/sheet';
import { Settings, Trash2 } from 'lucide-react';


type TaskState = {
    assignments: string[];
    timestamp: string;
    completed: boolean;
};

type ShiftData = {
    teamMembers: string[];
    townshipMembers: string[];
    tasksState: { [taskName: string]: TaskState };
    tasks: { [category: string]: string[] };
    notes: any[];
    selectedTeam: 'Days' | 'Swing' | 'Grave';
};


export default function ShiftNotesTool() {
    const [isLoading, setIsLoading] = useState(true);
    const [shiftData, setShiftData] = useState<ShiftData>({
        teamMembers: [],
        townshipMembers: [],
        tasksState: {},
        tasks: {
            "Operations": [],
            "Amenities": [],
            "Packages": []
        },
        notes: [],
        selectedTeam: 'Days'
    });
    
    const [newTeamMember, setNewTeamMember] = useState('');
    const [newTownshipMember, setNewTownshipMember] = useState('');
    const [editTeam, setEditTeam] = useState(false);
    const [editTownship, setEditTownship] = useState(false);

    // Admin Panel State
    const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
    const [newTaskName, setNewTaskName] = useState('');
    const [newTaskCategory, setNewTaskCategory] = useState('Operations');
    const [editingTask, setEditingTask] = useState<{ category: string, name: string } | null>(null);
    
    const { toast } = useToast();

    const allTasks = Object.values(shiftData.tasks).flat();

    const saveData = useCallback(async (data: Partial<ShiftData>) => {
        try {
            const docRef = doc(db, 'shiftNotes', 'current');
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                await updateDoc(docRef, data);
            } else {
                await setDoc(docRef, data, { merge: true });
            }
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
                 const currentTasks = data.tasks || { "Operations": [], "Amenities": [], "Packages": [] };
                const allCurrentTasks = Object.values(currentTasks).flat();

                const validTasksState: { [taskName: string]: TaskState } = {};
                allCurrentTasks.forEach(task => {
                    validTasksState[task] = data.tasksState?.[task] || { assignments: [''], timestamp: '--:--', completed: false };
                });
                data.tasksState = validTasksState;
                data.tasks = currentTasks;
                setShiftData(data);
            } else {
                const defaultTasks = {
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
                 const initialTasksState: { [taskName: string]: TaskState } = {};
                Object.values(defaultTasks).flat().forEach(task => {
                    initialTasksState[task] = { assignments: [''], timestamp: '--:--', completed: false };
                });
                const initialData = { ...shiftData, tasks: defaultTasks, tasksState: initialTasksState};
                setShiftData(initialData);
                saveData(initialData);
            }
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, [saveData]);


    const handleAddTeamMember = () => {
        if (newTeamMember && !shiftData.teamMembers.includes(newTeamMember)) {
            const teamMembers = [...shiftData.teamMembers, newTeamMember];
            setShiftData({...shiftData, teamMembers});
            saveData({ teamMembers });
            setNewTeamMember('');
        }
    };
    
    const handleAddTownshipMember = () => {
        if (newTownshipMember && !shiftData.townshipMembers.includes(newTownshipMember)) {
            const townshipMembers = [...shiftData.townshipMembers, newTownshipMember];
            setShiftData({...shiftData, townshipMembers});
            saveData({ townshipMembers });
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
        setShiftData({ ...shiftData, teamMembers: updatedMembers });
        saveData({ teamMembers: updatedMembers });
    };

    const handleTownshipMemberUpdate = (index: number, value: string) => {
        const updatedMembers = [...shiftData.townshipMembers];
        if(value.trim() === '') {
            updatedMembers.splice(index, 1);
        } else {
            updatedMembers[index] = value;
        }
        setShiftData({ ...shiftData, townshipMembers: updatedMembers });
        saveData({ townshipMembers: updatedMembers });
    };

    const handleSetTeam = (team: 'Days' | 'Swing' | 'Grave') => {
        const updatedData = { ...shiftData, selectedTeam: team };
        setShiftData(updatedData);
        saveData({ selectedTeam: team });
    };
    
    const handleTaskAssignmentChange = (taskName: string, assignmentIndex: number, assignee: string) => {
        const newTasksState = { ...shiftData.tasksState };
        const finalAssignee = assignee === 'unassigned' ? '' : assignee;
        newTasksState[taskName].assignments[assignmentIndex] = finalAssignee;
        setShiftData({ ...shiftData, tasksState: newTasksState });
        saveData({ tasksState: newTasksState });
    };

    const handleCompleteTask = (taskName: string) => {
        const newTasksState = { ...shiftData.tasksState };
        newTasksState[taskName].completed = true;
        newTasksState[taskName].timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setShiftData({ ...shiftData, tasksState: newTasksState });
        saveData({ tasksState: newTasksState });
    };

     const handleAddTask = () => {
        if (!newTaskName.trim()) {
            toast({ variant: 'destructive', title: 'Error', description: 'Task name cannot be empty.' });
            return;
        }
        const updatedTasks = { ...shiftData.tasks };
        updatedTasks[newTaskCategory] = [...updatedTasks[newTaskCategory], newTaskName];

        const updatedTasksState = { ...shiftData.tasksState, [newTaskName]: { assignments: [''], timestamp: '--:--', completed: false }};
        
        setShiftData({ ...shiftData, tasks: updatedTasks, tasksState: updatedTasksState });
        saveData({ tasks: updatedTasks, tasksState: updatedTasksState });
        setNewTaskName('');
        toast({ title: 'Success', description: 'Task added.' });
    };

    const handleUpdateTask = () => {
        if (!editingTask || !newTaskName.trim()) return;

        const updatedTasks = { ...shiftData.tasks };
        // Remove from old category
        updatedTasks[editingTask.category] = updatedTasks[editingTask.category].filter(t => t !== editingTask.name);
        // Add to new category
        updatedTasks[newTaskCategory] = [...updatedTasks[newTaskCategory], newTaskName];
        
        const updatedTasksState = { ...shiftData.tasksState };
        if(editingTask.name !== newTaskName) {
            updatedTasksState[newTaskName] = updatedTasksState[editingTask.name];
            delete updatedTasksState[editingTask.name];
        }

        setShiftData({ ...shiftData, tasks: updatedTasks, tasksState: updatedTasksState });
        saveData({ tasks: updatedTasks, tasksState: updatedTasksState });

        setNewTaskName('');
        setEditingTask(null);
        toast({ title: 'Success', description: 'Task updated.' });
    };

    const handleDeleteTask = (category: string, taskName: string) => {
        if(!confirm(`Are you sure you want to delete the task "${taskName}"?`)) return;

        const updatedTasks = { ...shiftData.tasks };
        updatedTasks[category] = updatedTasks[category].filter(t => t !== taskName);

        const updatedTasksState = { ...shiftData.tasksState };
        delete updatedTasksState[taskName];

        setShiftData({ ...shiftData, tasks: updatedTasks, tasksState: updatedTasksState });
        saveData({ tasks: updatedTasks, tasksState: updatedTasksState });
        toast({ title: 'Success', description: 'Task deleted.' });
    };

    const startEditing = (category: string, taskName: string) => {
        setEditingTask({ category, name: taskName });
        setNewTaskName(taskName);
        setNewTaskCategory(category);
    };

    const cancelEditing = () => {
        setEditingTask(null);
        setNewTaskName('');
        setNewTaskCategory('Operations');
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
                <div className="flex gap-2">
                    <Sheet open={isAdminPanelOpen} onOpenChange={setIsAdminPanelOpen}>
                        <SheetTrigger asChild>
                            <Button variant="outline" size="icon"><Settings /></Button>
                        </SheetTrigger>
                        <SheetContent>
                            <SheetHeader>
                                <SheetTitle>Admin Settings</SheetTitle>
                                <CardDescription>Manage tasks for all shifts.</CardDescription>
                            </SheetHeader>
                            <div className="py-4 space-y-4">
                               <Card>
                                   <CardHeader>
                                       <CardTitle>{editingTask ? 'Edit Task' : 'Add New Task'}</CardTitle>
                                   </CardHeader>
                                   <CardContent className="space-y-2">
                                       <Input 
                                        placeholder="Task name" 
                                        value={newTaskName} 
                                        onChange={(e) => setNewTaskName(e.target.value)}
                                       />
                                       <Select value={newTaskCategory} onValueChange={(v) => setNewTaskCategory(v as 'Operations' | 'Amenities' | 'Packages')}>
                                            <SelectTrigger><SelectValue/></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Operations">Operations</SelectItem>
                                                <SelectItem value="Amenities">Amenities</SelectItem>
                                                <SelectItem value="Packages">Packages</SelectItem>
                                            </SelectContent>
                                       </Select>
                                       <div className="flex gap-2 pt-2">
                                        {editingTask ? (
                                            <>
                                                <Button onClick={handleUpdateTask} className="w-full">Update Task</Button>
                                                <Button onClick={cancelEditing} variant="ghost" className="w-full">Cancel</Button>
                                            </>
                                        ) : (
                                            <Button onClick={handleAddTask} className="w-full">Add Task</Button>
                                        )}
                                       </div>
                                   </CardContent>
                               </Card>
                               <div>
                                {Object.entries(shiftData.tasks).map(([category, tasks]) => (
                                    <div key={category}>
                                        <h4 className="font-bold my-2">{category}</h4>
                                        <ul className="space-y-1">
                                            {tasks.map(task => (
                                                <li key={task} className="flex justify-between items-center bg-secondary p-2 rounded-md">
                                                    <span>{task}</span>
                                                    <div className="flex gap-1">
                                                        <Button size="sm" variant="ghost" onClick={() => startEditing(category, task)}>Edit</Button>
                                                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDeleteTask(category, task)}><Trash2 className="h-4 w-4"/></Button>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                               </div>
                            </div>
                        </SheetContent>
                    </Sheet>
                    <Button variant="destructive">Reset Shift</Button>
                </div>
            </header>

            <div className="grid md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Team Roster</CardTitle>
                        <div className="flex items-center space-x-2 pt-2">
                            <Label htmlFor="shiftSelector">Team:</Label>
                            <Select value={shiftData.selectedTeam} onValueChange={(v) => handleSetTeam(v as any)}>
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
                            {Object.entries(shiftData.tasks).map(([category, tasks]) => (
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

    