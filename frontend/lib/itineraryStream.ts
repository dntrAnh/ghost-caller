export const MOCK_PROFILES = {
  profiles: [
    {
      name: "Maya",
      phone: "+15550000101",
      cuisines_loved: ["Mexican", "Mediterranean"],
      cuisines_avoided: ["fast food"],
      dietary_restrictions: ["vegetarian"],
      price_range: "mid",
      availability: ["2026-06-14", "2026-06-15"],
      preferred_meal_times: { lunch: "12-2pm", dinner: "7-9pm" },
      buffer_mins: 30,
      flexibility_mins: 20,
      neighborhood: "",
      transport_mode: "transit",
      max_travel_mins: 30,
      vibes: ["cozy", "artsy", "lively"],
      photo_spots: true,
      past_places: [],
      vetoed_places: [],
    },
    {
      name: "Jordan",
      phone: "+15550000102",
      cuisines_loved: ["Japanese", "American"],
      cuisines_avoided: [],
      dietary_restrictions: [],
      price_range: "splurge",
      availability: ["2026-06-14", "2026-06-15", "2026-06-16"],
      preferred_meal_times: { lunch: "1-3pm", dinner: "8-10pm" },
      buffer_mins: 20,
      flexibility_mins: 30,
      neighborhood: "",
      transport_mode: "uber",
      max_travel_mins: 45,
      vibes: ["rooftop", "upscale", "lively"],
      photo_spots: true,
      past_places: [],
      vetoed_places: [],
    },
    {
      name: "Sam",
      phone: "+15550000103",
      cuisines_loved: ["BBQ", "Italian", "Mexican"],
      cuisines_avoided: ["sushi"],
      dietary_restrictions: ["gluten-free"],
      price_range: "mid",
      availability: ["2026-06-14", "2026-06-15"],
      preferred_meal_times: { lunch: "12-1pm", dinner: "6-8pm" },
      buffer_mins: 45,
      flexibility_mins: 15,
      neighborhood: "",
      transport_mode: "walking",
      max_travel_mins: 25,
      vibes: ["outdoor", "casual", "quiet"],
      photo_spots: false,
      past_places: [],
      vetoed_places: [],
    },
  ],
};

export type SSEEventName =
  | "planning"
  | "skeleton_ready"
  | "geocoding"
  | "searching_block"
  | "block_ready"
  | "complete"
  | "error";

export interface SSEProgressEvent {
  event: SSEEventName;
  data: Record<string, unknown>;
}

export interface LogLine {
  event: string;
  message: string;
  timestamp: string;
}

export function buildLogLine(e: SSEProgressEvent): LogLine {
  return {
    event: e.event,
    message: (e.data.message as string) ?? e.event,
    timestamp: new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
  };
}

export async function streamItinerary(
  onEvent: (e: SSEProgressEvent) => void,
  onComplete: (itinerary: unknown) => void,
  onError: (message: string) => void,
  neighborhood?: string
): Promise<void> {
  const nb = neighborhood?.trim() || 'Williamsburg, Brooklyn';
  const body = {
    group_id: `trip-${nb.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    profiles: MOCK_PROFILES.profiles.map((p) => ({ ...p, neighborhood: nb })),
  };

  const response = await fetch(
    "http://127.0.0.1:8000/api/v1/itinerary/build/stream",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok || !response.body) {
    onError(`Server error: ${response.status}`);
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // SSE messages are separated by double newlines
    const parts = buffer.split("\n\n");
    buffer = parts.pop() ?? "";

    for (const part of parts) {
      if (!part.trim()) continue;

      const eventLine = part.match(/^event:\s*(.+)$/m);
      const dataLine = part.match(/^data:\s*(.+)$/m);

      if (!eventLine || !dataLine) continue;

      const eventName = eventLine[1].trim() as SSEEventName;
      let data: Record<string, unknown> = {};
      try {
        data = JSON.parse(dataLine[1].trim());
      } catch {
        continue;
      }

      onEvent({ event: eventName, data });

      if (eventName === "complete") {
        onComplete(data.itinerary);
        return;
      }

      if (eventName === "error") {
        onError((data.message as string) ?? "Unknown error");
        return;
      }
    }
  }
}
