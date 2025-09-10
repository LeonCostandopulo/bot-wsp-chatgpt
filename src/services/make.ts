export type BookingPayload = {
  from: string;
  message: string;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
  timestamp?: string;
  name?: string;
  startDate?: string; // ISO con offset -03:00
};

export type AvailabilityResult = {
  available: boolean;
  suggestion?: string;
  raw?: any;
};

/**
 * Envía datos de reserva a un webhook de Make para que allí se guarde en Google Sheets/Drive.
 * Requiere la variable de entorno MAKE_WEBHOOK_URL.
 */
export async function sendBookingToMake(payload: BookingPayload): Promise<void> {
  const url = process.env.MAKE_ADD_TO_CALENDAR || process.env.MAKE_WEBHOOK_URL;
  if (!url) {
    console.warn('[MAKE] MAKE_ADD_TO_CALENDAR/MAKE_WEBHOOK_URL no está definida; no se enviará la reserva.');
    return;
  }
  try {
    console.log('[MAKE] Enviando reserva ->', { url, body: payload });
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const text = await res.text().catch(() => '');
    if (!res.ok) {
      console.error('[MAKE] Error HTTP al enviar a Make:', { url, status: res.status, statusText: res.statusText, body: text });
    } else {
      console.log('[MAKE] Reserva enviada correctamente a Make:', { url, response: text || '(sin cuerpo)' });
    }
  } catch (err) {
    console.error('[MAKE] Error de red al enviar a Make:', { url, err });
  }
}

/**
 * Consulta disponibilidad en Make. Retorna true/false y una sugerencia opcional.
 * Si no hay webhook configurado, devuelve available=true (no bloquea el flujo).
 */
export async function checkAvailabilityWithMake(targetStartDateISO: string): Promise<AvailabilityResult> {
  const url = process.env.MAKE_GET_FROM_CALENDAR;
  if (!url) {
    console.warn('[MAKE] MAKE_GET_FROM_CALENDAR no está definida; se asume disponibilidad.');
    return { available: true };
  }
  try {
    // El blueprint GET responde un JSON con objetos { date, name }
    // No requiere body específico; usamos POST sin body para compatibilidad general.
    console.log('[MAKE] Consultando disponibilidad ->', { url, targetStartDateISO });
    const res = await fetch(url, { method: 'POST' });
    const text = await res.text().catch(() => '');
    if (!res.ok) {
      console.error('[MAKE] Error HTTP en disponibilidad:', { url, status: res.status, statusText: res.statusText, body: text });
      return { available: false };
    }
    let data: any = null;
    try { data = text ? JSON.parse(text) : null; } catch { /* puede ser texto plano */ }
    // data debería ser un array [{ date: string, name: string }, ...]
    const rows: Array<{ date?: string; name?: string }> = Array.isArray(data) ? data : [];
    const found = rows.some(r => (r.date || '').trim() === targetStartDateISO.trim());
    const available = !found;
    console.log('[MAKE] Disponibilidad recibida:', { count: rows.length, available, foundMatch: found, targetStartDateISO });
    return { available, raw: data };
  } catch (err) {
    console.error('[MAKE] Error de red en disponibilidad:', { url, err });
    // En caso de error de red, no bloquear: asumir no disponible para evitar doble reserva.
    return { available: false };
  }
}
