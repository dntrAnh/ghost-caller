export type CallStatus =
  | 'initiated'
  | 'ringing'
  | 'connected'
  | 'negotiating'
  | 'confirmed'
  | 'completed'
  | 'busy'
  | 'no_answer'
  | 'canceled'
  | 'failed';

export type TranscriptLine = {
  speaker: string;
  text: string;
  timestamp: string;
};

export type SentimentEntry = {
  text: string;
  sentiment: string;
  confidence: number;
};

export type ProgressStep = {
  label: string;
  completed: boolean;
  active: boolean;
};

export type CallRecord = {
  id: string;
  booking_id: string;
  restaurant_name: string;
  restaurant_phone: string;
  status: CallStatus;
  transcript: TranscriptLine[];
  sentiment_log: SentimentEntry[];
  confirmation_code?: string | null;
  confirmed_time?: string | null;
  confirmed_date?: string | null;
  created_at: string;
  duration_seconds?: number | null;
};

export type InitiateCallRequest = {
  restaurant_name: string;
  restaurant_phone: string;
  party_size: number;
  preferred_date: string;
  preferred_time: string;
  buffer_minutes?: number;
  dietary_restrictions: string[];
  user_name: string;
  conversation_style?: 'strict' | 'friendly';
};

export type CallStatusResponse = {
  call_id: string;
  status: string;
  transcript: TranscriptLine[];
  sentiment_log: SentimentEntry[];
  confirmation_code?: string | null;
  confirmed_time?: string | null;
  confirmed_date?: string | null;
};

export type CallControlRequest = {
  action: 'stop' | 'speak';
  message?: string;
};

export type InviteAttendee = {
  name: string;
  email: string;
};

export type CalendarInvite = {
  id: string;
  call_record_id: string;
  attendees: Array<InviteAttendee & { dietary?: string | null }>;
  ics_content: string;
  sent: boolean;
  sent_at?: string | null;
};

export type GenerateICSRequest = {
  call_id: string;
  attendees: InviteAttendee[];
  restaurant_name: string;
  restaurant_address: string;
  confirmed_date: string;
  confirmed_time: string;
  restaurant_phone: string;
  dietary_notes: string;
};

export type SendInvitesRequest = {
  ics_content: string;
  attendees: InviteAttendee[];
  restaurant_name: string;
  confirmed_date: string;
  confirmed_time: string;
};

export type CallStreamUpdate = {
  event: string;
  call_id: string;
  [key: string]: unknown;
};

export type SendInvitesResponse = {
  subject: string;
  results: Array<{
    name: string;
    email: string;
    success: boolean;
    error?: string;
  }>;
  success_count: number;
  failure_count: number;
};
