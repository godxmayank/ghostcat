import Pusher from 'pusher';

// Initialize Pusher server
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
  useTLS: true,
});

/**
 * POST /api/signal
 * Relay encrypted messages and key exchange events through Pusher
 * Events: message, share-key, peer-joined, peer-left
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { roomId, event, data } = body;

    // Validation
    if (!roomId || typeof roomId !== 'string' || roomId.length > 32) {
      return new Response(JSON.stringify({ error: 'Invalid roomId' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const validEvents = ['message', 'share-key', 'peer-joined', 'peer-left', 'typing'];
    if (!validEvents.includes(event)) {
      return new Response(JSON.stringify({ error: 'Invalid event' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Trigger event on Pusher channel
    // WARNING: We do NOT log or store the data field
    try {
      await pusher.trigger(roomId, event, {
        data,
        // timestamp added server-side for ordering, not for logging
      });
    } catch (pusherError) {
      console.error('Pusher trigger error:', pusherError.message);
      return new Response(JSON.stringify({ error: 'Delivery failed' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Signal API error:', error.message);
    return new Response(JSON.stringify({ error: 'Bad request' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
