export type Urgency = 'low' | 'medium' | 'high';

export interface PassOnNote {
  id: string;
  text: string;
  urgency: Urgency;
  timestamp: {
    seconds: number;
    nanoseconds: number;
  };
  completed: boolean;
}

export interface Contact {
  name: string;
  phone: string;
}

export interface Incident {
  id?: string;
  dateObj: Date;
  timeCalled?: string;
  timeArrived?: string;
  resolutionTime?: string;
  description?: string;
  location?: string;
  resolutionDescription?: string;
  isLegacy?: boolean;
  timestamp?: any;
}
