export type ParsedDateTime = {
  iso: string;      // ISO con offset -03:00
  display: string;  // Texto legible, ej: "24/08/2025 14:00"
};

const TZ_OFFSET = "-03:00"; // America/Argentina/Buenos_Aires

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function toISOWithOffset(date: Date): string {
  // Construye ISO manual con offset fijo -03:00
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const hh = pad(date.getHours());
  const mm = pad(date.getMinutes());
  const ss = pad(date.getSeconds());
  return `${y}-${m}-${d}T${hh}:${mm}:${ss}${TZ_OFFSET}`;
}

function toDisplay(date: Date): string {
  const dd = pad(date.getDate());
  const mm = pad(date.getMonth() + 1);
  const yyyy = date.getFullYear();
  const hh = pad(date.getHours());
  const m = pad(date.getMinutes());
  const weekdays = ['dom','lun','mar','mié','jue','vie','sáb'];
  const wd = weekdays[date.getDay()];
  return `${wd} ${dd}/${mm}/${yyyy} ${hh}:${m}`;
}

/**
 * Parseo básico de español: "hoy", "mañana", "dd/mm [hh:mm]", "hh[:mm] [am|pm|hs]".
 * Si encuentra sólo hora, usa hoy/mañana según aparezca.
 */
export function parseSpanishDateTime(text: string, now: Date = new Date(), defaultDayOffset?: number): ParsedDateTime | null {
  const t = text.toLowerCase();

  // Determinar base de fecha
  const base = new Date(now);
  let dayApplied = false;
  if (/(pasado\s*ma[ñn]ana|despu[eé]s\s*de\s*ma[ñn]ana)/i.test(t)) {
    console.log('[DT] Detectado: pasado mañana');
    base.setDate(base.getDate() + 2);
    dayApplied = true;
  } else if (/(\bma[ñn]ana\b)/i.test(t)) {
    console.log('[DT] Detectado: mañana');
    base.setDate(base.getDate() + 1);
    dayApplied = true;
  } else if (/(hoy)/i.test(t)) {
    // base = hoy (ya lo es)
    dayApplied = true;
  }

  // Intentar dd/mm opcional
  const dm = t.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/);
  if (dm) {
    const day = parseInt(dm[1], 10);
    const month = parseInt(dm[2], 10) - 1;
    const year = dm[3] ? parseInt(dm[3], 10) : base.getFullYear();
    base.setFullYear(year);
    base.setMonth(month);
    base.setDate(day);
    dayApplied = true;
  }

  // Buscar hora
  const hm = t.match(/\b(\d{1,2})(?:[:h\.](\d{2}))?\s*(am|pm|hs|hrs|h)?\b/);
  if (!hm) {
    // No encontré hora; si tenés un desplazamiento por defecto, igual devolvemos base sin hora
    if (defaultDayOffset !== undefined && !dayApplied) {
      base.setDate(base.getDate() + defaultDayOffset);
      const iso = toISOWithOffset(base);
      const display = toDisplay(base);
      console.log('[DT] Sin hora, con defaultDayOffset:', { input: text, base: base.toISOString(), defaultDayOffset });
      return { iso, display };
    }
    return null; // no encontré hora ni hint usable
  }
  let hour = parseInt(hm[1], 10);
  const minute = hm[2] ? parseInt(hm[2], 10) : 0;
  const suffix = hm[3] ? hm[3].toLowerCase() : '';

  const morningHint = /(de\s+la\s+ma[ñn]ana|temprano|a\s*la\s*ma[ñn]ana)/i.test(t);
  const afternoonHint = /(de\s+la\s+tarde)/i.test(t);
  const nightHint = /(de\s+la\s+noche)/i.test(t);

  if (suffix.includes('am') || suffix.includes('pm')) {
    if (suffix.includes('am')) {
      if (hour === 12) hour = 0;
    } else if (suffix.includes('pm')) {
      if (hour < 12) hour += 12;
    }
  } else {
    // Sin am/pm: aplicar heurística natural para atención al cliente (AR)
    if (afternoonHint || nightHint) {
      if (hour < 12) hour += 12; // 2 -> 14
    } else if (morningHint) {
      // Mantener como mañana
      if (hour === 12) hour = 0;
    } else {
      // Por defecto, asumir PM si la hora es baja (1..8), que es lo más pedido en barbería
      if (hour >= 1 && hour <= 8) {
        hour += 12; // 2 -> 14, 7 -> 19
      }
      // 9..11 se dejan como 9/10/11 hs; 12 queda 12.
    }
  }

  // Aplicar defaultDayOffset si no hubo día explícito
  if (!dayApplied && defaultDayOffset !== undefined) {
    base.setDate(base.getDate() + defaultDayOffset);
  }

  base.setHours(hour, minute, 0, 0);

  console.log('[DT] Resultado parseo:', { input: text, base: base.toISOString(), hour, minute });

  const iso = toISOWithOffset(base);
  const display = toDisplay(base);
  return { iso, display };
}
