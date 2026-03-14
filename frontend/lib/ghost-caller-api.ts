import { saveAs } from 'file-saver';

import type {
  CallStatusResponse,
  CallStreamUpdate,
  GenerateICSRequest,
  InitiateCallRequest,
  SendInvitesRequest,
  SendInvitesResponse,
} from '@/types/call';

const DEFAULT_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1:8000';

async function parseJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Ghost caller request failed (${response.status}): ${errorText}`);
  }
  return response.json() as Promise<T>;
}

async function postJson<TResponse>(path: string, body: unknown): Promise<TResponse> {
  const response = await fetch(`${DEFAULT_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  return parseJson<TResponse>(response);
}

export async function initiateCall(params: InitiateCallRequest): Promise<CallStatusResponse> {
  return postJson<CallStatusResponse>('/api/call/initiate', {
    restaurant_name: params.restaurant_name,
    restaurant_phone: params.restaurant_phone,
    party_size: params.party_size,
    preferred_date: params.preferred_date,
    preferred_time: params.preferred_time,
    buffer_minutes: params.buffer_minutes ?? 30,
    dietary_restrictions: params.dietary_restrictions,
    user_name: params.user_name,
  });
}

export async function getCallStatus(callId: string): Promise<CallStatusResponse> {
  const response = await fetch(`${DEFAULT_BASE_URL}/api/call/${callId}/status`);
  return parseJson<CallStatusResponse>(response);
}

export function subscribeToCallStream(
  callId: string,
  onUpdate: (update: CallStreamUpdate) => void,
): EventSource {
  const stream = new EventSource(`${DEFAULT_BASE_URL}/api/call/${callId}/stream`);

  const forwardEvent = (event: MessageEvent<string>) => {
    const payload = JSON.parse(event.data) as CallStreamUpdate;
    onUpdate(payload);
  };

  stream.addEventListener('status', forwardEvent as EventListener);
  stream.addEventListener('transcript', forwardEvent as EventListener);
  stream.addEventListener('state_change', forwardEvent as EventListener);
  stream.addEventListener('sentiment', forwardEvent as EventListener);
  stream.addEventListener('confirmation', forwardEvent as EventListener);
  stream.addEventListener('agent_action', forwardEvent as EventListener);
  stream.addEventListener('agent_reply', forwardEvent as EventListener);
  stream.addEventListener('call_started', forwardEvent as EventListener);
  stream.addEventListener('call_finished', forwardEvent as EventListener);
  stream.addEventListener('error', forwardEvent as EventListener);

  return stream;
}

export async function generateICS(
  params: GenerateICSRequest,
): Promise<{ ics_content: string; confirmation_code?: string; invite_id?: string; call_id?: string }> {
  return postJson<{ ics_content: string; confirmation_code?: string; invite_id?: string; call_id?: string }>(
    '/api/calendar/generate-ics',
    params,
  );
}

export async function sendInvites(params: SendInvitesRequest): Promise<SendInvitesResponse> {
  return postJson<SendInvitesResponse>('/api/calendar/send-invites', params);
}

export async function downloadICS(callId: string): Promise<void> {
  const response = await fetch(`${DEFAULT_BASE_URL}/api/calendar/${callId}/download-ics`);
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Ghost caller request failed (${response.status}): ${errorText}`);
  }

  const blob = await response.blob();
  saveAs(blob, `reservation-${callId}.ics`);
}
