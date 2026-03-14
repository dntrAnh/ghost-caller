'use client';

import { saveAs } from 'file-saver';
import { useCallback, useEffect, useMemo, useState } from 'react';

type SentimentLabel = 'positive' | 'negative' | 'ambiguous';
type UiState = 'ready' | 'calling' | 'confirmed';
type TerminalCallStatus = 'BUSY' | 'NO_ANSWER' | 'CANCELED' | 'FAILED' | 'COMPLETED';

type TranscriptLine = {
  id: string;
  speaker: string;
  text: string;
  timestamp: string;
};

type SentimentInsight = {
  id: string;
  text: string;
  sentiment: SentimentLabel;
  confidence: number;
  keywords: string[];
};

type CallStatusResponse = {
  call_id: string;
  status: string;
  transcript: Array<{ speaker: string; text: string; timestamp: string }>;
  sentiment_log: Array<{ text: string; sentiment: string; confidence: number }>;
  confirmation_code?: string | null;
  confirmed_time?: string | null;
  confirmed_date?: string | null;
};

type InviteAttendee = {
  name: string;
  email: string;
  dietary?: string;
};

type GhostCallerProps = {
  restaurant: {
    name: string;
    address: string;
    score: number;
    cuisine: string;
    phone: string;
  };
  party: {
    size: number;
    dietaryRestrictions: string[];
    date: string;
    time: string;
    userName: string;
    attendees: InviteAttendee[];
  };
  onCallStateChange?: (state: {
    status: string;
    progressIndex: number;
    confirmed: boolean;
    confirmationCode: string | null;
  }) => void;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1:8000';

const PROGRESS_STEPS = [
  'calling the restaurant',
  'picking up',
  'confirming details',
  'successfully reserved',
] as const;

const SENTIMENT_KEYWORDS = [
  'yes',
  'sure',
  'possible',
  'absolutely',
  'of course',
  'can do',
  'sorry',
  'full',
  'booked',
  'unavailable',
  'no',
  "can't",
  'later',
  'time',
  'tonight',
  'reservation',
  'table',
];

const TERMINAL_STATUSES: Set<TerminalCallStatus> = new Set<TerminalCallStatus>([
  'BUSY',
  'NO_ANSWER',
  'CANCELED',
  'FAILED',
  'COMPLETED',
]);

async function parseJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Request failed (${response.status}): ${text}`);
  }
  return response.json() as Promise<T>;
}

function toTranscriptLine(line: { speaker: string; text: string; timestamp?: string }, index: number): TranscriptLine {
  return {
    id: `${line.speaker}-${line.timestamp ?? Date.now().toString()}-${index}`,
    speaker: line.speaker,
    text: line.text,
    timestamp: line.timestamp ?? new Date().toISOString(),
  };
}

function extractKeywords(text: string): string[] {
  const lower = text.toLowerCase();
  const matched = SENTIMENT_KEYWORDS.filter((keyword) => lower.includes(keyword));
  return matched.length > 0 ? matched : lower.split(/\W+/).filter((token) => token.length > 4).slice(0, 3);
}

function sentimentClass(sentiment: SentimentLabel): string {
  if (sentiment === 'positive') return 'text-emerald-700 bg-emerald-50 border-emerald-200';
  if (sentiment === 'negative') return 'text-rose-700 bg-rose-50 border-rose-200';
  return 'text-amber-700 bg-amber-50 border-amber-200';
}

function terminalStatusMessage(status: TerminalCallStatus): string {
  if (status === 'BUSY') return 'The destination line is busy. Please retry in a moment.';
  if (status === 'NO_ANSWER') return 'No answer from the destination number.';
  if (status === 'CANCELED') return 'The call was canceled before connecting.';
  if (status === 'FAILED') return 'The call failed to connect.';
  return 'The call ended before a reservation was confirmed.';
}

export function GhostCaller({ restaurant, party, onCallStateChange }: GhostCallerProps) {
  const [uiState, setUiState] = useState<UiState>('ready');
  const [callId, setCallId] = useState<string | null>(null);
  const [callStatus, setCallStatus] = useState<string>('INITIATED');
  const [agentState, setAgentState] = useState<string>('');
  const [transcript, setTranscript] = useState<TranscriptLine[]>([]);
  const [sentiments, setSentiments] = useState<SentimentInsight[]>([]);
  const [renegotiationCount, setRenegotiationCount] = useState(0);
  const [confirmationCode, setConfirmationCode] = useState<string>('');
  const [confirmedDate, setConfirmedDate] = useState<string>(party.date);
  const [confirmedTime, setConfirmedTime] = useState<string>(party.time);
  const [icsContent, setIcsContent] = useState<string>('');
  const [isIcsExpanded, setIsIcsExpanded] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [isSendingInvites, setIsSendingInvites] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attendeeDelivery, setAttendeeDelivery] = useState<Record<string, boolean>>({});

  const formattedDietary = party.dietaryRestrictions.length > 0
    ? party.dietaryRestrictions.join(', ')
    : 'No dietary restrictions';

  const turnsTaken = transcript.length;
  const isRetryEligible = TERMINAL_STATUSES.has(callStatus.toUpperCase() as TerminalCallStatus);

  const progressIndex = useMemo(() => {
    const normalized = callStatus.toLowerCase();
    if (normalized === 'confirmed') return 3;
    if (agentState === 'confirming' || normalized === 'negotiating' || normalized === 'connected') return 2;
    if (normalized === 'ringing' || normalized === 'connected' || normalized === 'negotiating') return 1;
    if (normalized === 'initiated') return 0;
    return 0;
  }, [callStatus, agentState]);

  const syncFromStatusResponse = useCallback((payload: CallStatusResponse) => {
    const normalizedStatus = payload.status.toUpperCase();
    setCallStatus(normalizedStatus);
    if (payload.confirmation_code) setConfirmationCode(payload.confirmation_code);
    if (payload.confirmed_date) setConfirmedDate(payload.confirmed_date);
    if (payload.confirmed_time) setConfirmedTime(payload.confirmed_time);

    setTranscript(payload.transcript.map((line, index) => toTranscriptLine(line, index)));
    setSentiments(
      payload.sentiment_log.map((entry, index) => ({
        id: `${index}-${entry.sentiment}-${entry.confidence}`,
        text: entry.text,
        sentiment: (entry.sentiment?.toLowerCase() as SentimentLabel) || 'ambiguous',
        confidence: entry.confidence,
        keywords: extractKeywords(entry.text),
      }))
    );

    if (payload.status.toLowerCase() === 'confirmed') {
      setUiState('confirmed');
    }

    const terminalStatus = normalizedStatus as TerminalCallStatus;
    if (TERMINAL_STATUSES.has(terminalStatus)) {
      setError(terminalStatusMessage(terminalStatus));
    }
  }, []);

  useEffect(() => {
    onCallStateChange?.({
      status: callStatus,
      progressIndex,
      confirmed: uiState === 'confirmed' || callStatus.toLowerCase() === 'confirmed',
      confirmationCode: confirmationCode || null,
    });
  }, [callStatus, confirmationCode, onCallStateChange, progressIndex, uiState]);

  useEffect(() => {
    if (!callId || uiState === 'ready') return;

    const eventSource = new EventSource(`${API_BASE_URL}/api/call/${callId}/stream`);

    const onStatus = (event: MessageEvent<string>) => {
      const payload = JSON.parse(event.data) as CallStatusResponse;
      syncFromStatusResponse(payload);
    };

    const onTranscript = (event: MessageEvent<string>) => {
      const payload = JSON.parse(event.data) as { speaker: string; text: string; call_id: string };
      setTranscript((prev) => [
        ...prev,
        {
          id: `${payload.speaker}-${Date.now()}-${prev.length}`,
          speaker: payload.speaker,
          text: payload.text,
          timestamp: new Date().toISOString(),
        },
      ]);
    };

    const onState = (event: MessageEvent<string>) => {
      const payload = JSON.parse(event.data) as { state?: string; status: string };
      if (payload.state) {
        setAgentState(payload.state);
      }
      setCallStatus(payload.status.toUpperCase());
      if (payload.state === 'negotiating') {
        setRenegotiationCount((count) => count + 1);
      }

      const normalized = payload.status.toUpperCase() as TerminalCallStatus;
      if (TERMINAL_STATUSES.has(normalized)) {
        setError(terminalStatusMessage(normalized));
      }
    };

    const onSentiment = (event: MessageEvent<string>) => {
      const payload = JSON.parse(event.data) as {
        sentiment: string;
        confidence: number;
        text: string;
      };

      setSentiments((prev) => [
        ...prev,
        {
          id: `${Date.now()}-${prev.length}`,
          text: payload.text,
          sentiment: (payload.sentiment.toLowerCase() as SentimentLabel) || 'ambiguous',
          confidence: payload.confidence,
          keywords: extractKeywords(payload.text),
        },
      ]);
    };

    const onConfirmation = (event: MessageEvent<string>) => {
      const payload = JSON.parse(event.data) as {
        confirmation_code: string;
        confirmed_date: string;
        confirmed_time: string;
      };

      setConfirmationCode(payload.confirmation_code);
      setConfirmedDate(payload.confirmed_date || party.date);
      setConfirmedTime(payload.confirmed_time || party.time);
      setCallStatus('CONFIRMED');
      setUiState('confirmed');
    };

    const onErrorEvent = (event: MessageEvent<string>) => {
      const payload = JSON.parse(event.data) as { message: string };
      setError(payload.message || 'Call stream failed.');
    };

    const onWarningEvent = (event: MessageEvent<string>) => {
      const payload = JSON.parse(event.data) as { message: string };
      setError(payload.message || 'Call warning.');
    };

    eventSource.addEventListener('status', onStatus as EventListener);
    eventSource.addEventListener('transcript', onTranscript as EventListener);
    eventSource.addEventListener('state_change', onState as EventListener);
    eventSource.addEventListener('sentiment', onSentiment as EventListener);
    eventSource.addEventListener('confirmation', onConfirmation as EventListener);
    eventSource.addEventListener('error', onErrorEvent as EventListener);
    eventSource.addEventListener('warning', onWarningEvent as EventListener);
    eventSource.onerror = () => {
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [callId, party.date, party.time, syncFromStatusResponse, uiState]);

  const ensureIcs = useCallback(async () => {
    if (!callId || icsContent) return icsContent;

    const response = await fetch(`${API_BASE_URL}/api/calendar/generate-ics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        call_id: callId,
        attendees: party.attendees.map((attendee) => ({ name: attendee.name, email: attendee.email })),
        restaurant_name: restaurant.name,
        restaurant_address: restaurant.address,
        confirmed_date: confirmedDate,
        confirmed_time: confirmedTime,
        restaurant_phone: restaurant.phone,
        dietary_notes: formattedDietary,
      }),
    });

    const payload = await parseJson<{ ics_content: string; confirmation_code: string }>(response);
    if (payload.confirmation_code) setConfirmationCode(payload.confirmation_code);
    setIcsContent(payload.ics_content || '');
    return payload.ics_content || '';
  }, [callId, confirmedDate, confirmedTime, formattedDietary, icsContent, party.attendees, restaurant.address, restaurant.name, restaurant.phone]);

  useEffect(() => {
    if (uiState !== 'confirmed' || !callId) return;
    void ensureIcs();
  }, [callId, ensureIcs, uiState]);

  const handleInitiateCall = async () => {
    setIsBusy(true);
    setError(null);
    setAgentState('');
    setCallStatus('INITIATED');
    setTranscript([]);
    setSentiments([]);
    setRenegotiationCount(0);
    setConfirmationCode('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/call/initiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurant_name: restaurant.name,
          restaurant_phone: restaurant.phone,
          party_size: party.size,
          preferred_date: party.date,
          preferred_time: party.time,
          buffer_minutes: 30,
          dietary_restrictions: party.dietaryRestrictions,
          user_name: party.userName,
        }),
      });

      const payload = await parseJson<CallStatusResponse>(response);
      setCallId(payload.call_id);
      setUiState('calling');
      syncFromStatusResponse(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to initiate call.');
    } finally {
      setIsBusy(false);
    }
  };

  const handleDownloadIcs = async () => {
    if (!callId) return;

    setIsBusy(true);
    setError(null);
    try {
      await ensureIcs();
      const response = await fetch(`${API_BASE_URL}/api/calendar/${callId}/download-ics`);
      if (!response.ok) {
        throw new Error(`Download failed (${response.status})`);
      }
      const blob = await response.blob();
      saveAs(blob, `reservation-${callId}.ics`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to download .ics file.');
    } finally {
      setIsBusy(false);
    }
  };

  const handleSendInvites = async () => {
    if (!callId) return;

    setIsSendingInvites(true);
    setError(null);
    try {
      const content = await ensureIcs();
      const response = await fetch(`${API_BASE_URL}/api/calendar/send-invites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ics_content: content,
          attendees: party.attendees.map((attendee) => ({ name: attendee.name, email: attendee.email })),
          restaurant_name: restaurant.name,
          confirmed_date: confirmedDate,
          confirmed_time: confirmedTime,
        }),
      });

      const payload = await parseJson<{ results: Array<{ email: string; success: boolean }> }>(response);
      const next: Record<string, boolean> = {};
      for (const result of payload.results) {
        next[result.email] = result.success;
      }
      setAttendeeDelivery(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send invites.');
    } finally {
      setIsSendingInvites(false);
    }
  };

  const ReadyState = (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-600">Ghost Caller</p>
          <h2 className="text-2xl font-bold tracking-tight text-slate-950">Ready to Call</h2>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Restaurant</p>
            <h3 className="mt-2 text-lg font-semibold text-slate-900">{restaurant.name}</h3>
            <p className="text-sm text-slate-600">{restaurant.address}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-medium text-violet-700">Score {restaurant.score}</span>
              <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-medium text-slate-700">{restaurant.cuisine}</span>
            </div>
          </div>
        </div>

        <div className="space-y-4 rounded-2xl border border-violet-200 bg-violet-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">Party Details</p>
          <div className="space-y-2 text-sm text-slate-700">
            <p><span className="font-semibold">Size:</span> {party.size}</p>
            <p><span className="font-semibold">Date:</span> {party.date}</p>
            <p><span className="font-semibold">Time:</span> {party.time}</p>
            <p><span className="font-semibold">Dietary:</span> {formattedDietary}</p>
          </div>
          <button
            type="button"
            onClick={handleInitiateCall}
            disabled={isBusy}
            className="mt-2 w-full rounded-2xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isBusy ? 'Starting call...' : 'Ghost Caller — Reserve Now'}
          </button>
        </div>
      </div>
    </div>
  );

  const CallingState = (
    <div className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-violet-600">Live Transcript</p>
            <h3 className="mt-1 text-xl font-semibold text-slate-900">Calling</h3>
          </div>
          <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-medium text-violet-700">{callStatus}</span>
        </div>

        <div className="h-[360px] space-y-3 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50 p-3">
          {transcript.length === 0 ? (
            <p className="text-sm text-slate-500">Waiting for call transcript...</p>
          ) : (
            transcript.map((line) => (
              <div
                key={line.id}
                className={`max-w-[90%] rounded-2xl px-3 py-2 text-sm ${line.speaker === 'agent'
                  ? 'ml-auto bg-violet-600 text-white'
                  : 'bg-white text-slate-800 border border-slate-200'
                }`}
              >
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide opacity-75">{line.speaker}</p>
                <p>{line.text}</p>
              </div>
            ))
          )}
        </div>

        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
          Live call mode is active. Status updates now come directly from Twilio and transcript processing.
        </div>

        {isRetryEligible ? (
          <button
            type="button"
            onClick={handleInitiateCall}
            disabled={isBusy}
            className="mt-3 w-full rounded-xl border border-violet-300 bg-violet-50 px-4 py-2 text-sm font-semibold text-violet-700 transition hover:bg-violet-100 disabled:opacity-60"
          >
            {isBusy ? 'Retrying...' : 'Retry Call'}
          </button>
        ) : null}
      </div>

      <aside className="space-y-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Progress</p>
          <div className="mt-3 space-y-2">
            {PROGRESS_STEPS.map((step, index) => {
              const active = index <= progressIndex;
              return (
                <div key={step} className="flex items-center gap-2">
                  <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] ${active ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                    {active ? '✓' : index + 1}
                  </span>
                  <span className={`text-sm ${active ? 'text-slate-900' : 'text-slate-500'}`}>{step}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">NLU Sentiment</p>
          <div className="mt-3 space-y-2">
            {sentiments.length === 0 ? (
              <p className="text-sm text-slate-500">No sentiment detected yet.</p>
            ) : (
              sentiments.slice(-4).map((item) => (
                <div key={item.id} className={`rounded-xl border px-3 py-2 ${sentimentClass(item.sentiment)}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wide">{item.sentiment}</span>
                    <span className="text-xs">{Math.round(item.confidence * 100)}%</span>
                  </div>
                  <p className="mt-1 text-xs">{item.keywords.join(', ')}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </aside>
    </div>
  );

  const ConfirmedState = (
    <div className="space-y-4">
      <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
        <p className="text-sm font-semibold text-emerald-700">✅ Reservation Confirmed</p>
        <p className="mt-1 text-sm text-emerald-800">Confirmation code: <span className="font-bold">{confirmationCode || 'Pending'}</span></p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Restaurant Details</p>
          <div className="mt-3 space-y-2 text-sm text-slate-700">
            <p><span className="font-semibold">Restaurant:</span> {restaurant.name}</p>
            <p><span className="font-semibold">Date:</span> {confirmedDate}</p>
            <p><span className="font-semibold">Time:</span> {confirmedTime}</p>
            <p><span className="font-semibold">Location:</span> {restaurant.address}</p>
            <p><span className="font-semibold">Party:</span> {party.size}</p>
            <p><span className="font-semibold">Dietary:</span> {formattedDietary}</p>
            <p><span className="font-semibold">Phone:</span> {restaurant.phone}</p>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Call Summary</p>
          <div className="mt-3 space-y-2 text-sm text-slate-700">
            <p><span className="font-semibold">Turns taken:</span> {turnsTaken}</p>
            <p><span className="font-semibold">Renegotiations:</span> {renegotiationCount}</p>
            <p><span className="font-semibold">Final status:</span> {callStatus}</p>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Attendees</p>
        <div className="mt-3 space-y-2">
          {party.attendees.map((attendee) => {
            const delivered = attendeeDelivery[attendee.email];
            return (
              <div key={attendee.email} className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-sm">
                <div>
                  <p className="font-medium text-slate-800">{attendee.name}</p>
                  <p className="text-xs text-slate-500">{attendee.email}</p>
                </div>
                <span className={`rounded-full px-2 py-1 text-xs font-semibold ${delivered ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                  {delivered ? 'sent' : 'unsent'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleDownloadIcs}
          disabled={isBusy || !callId}
          className="rounded-2xl border border-violet-300 bg-violet-50 px-4 py-3 text-sm font-semibold text-violet-700 transition hover:bg-violet-100 disabled:opacity-60"
        >
          Download .ics File
        </button>
        <button
          type="button"
          onClick={handleSendInvites}
          disabled={isSendingInvites || !callId}
          className="rounded-2xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:opacity-60"
        >
          {isSendingInvites ? 'Sending...' : 'Send Invites'}
        </button>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <button
          type="button"
          onClick={() => setIsIcsExpanded((open) => !open)}
          className="flex w-full items-center justify-between text-left"
        >
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">.ics Preview</span>
          <span className="text-sm font-medium text-violet-600">{isIcsExpanded ? 'Hide' : 'Show'}</span>
        </button>
        {isIcsExpanded ? (
          <pre className="mt-3 max-h-64 overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
            {icsContent || 'No .ics generated yet.'}
          </pre>
        ) : null}
      </div>
    </div>
  );

  return (
    <section className="space-y-4 rounded-[28px] border border-slate-200 bg-white/85 p-5 shadow-sm backdrop-blur-sm sm:p-6">
      {uiState === 'ready' ? ReadyState : null}
      {uiState === 'calling' ? CallingState : null}
      {uiState === 'confirmed' ? ConfirmedState : null}
      {error ? <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
    </section>
  );
}
