import BotWhatsapp from '@bot-whatsapp/bot';
import { run, type Message } from '../services/openai/index.js';
import { sendBookingToMake, checkAvailabilityWithMake } from '../services/make.js';
import { parseSpanishDateTime } from '../services/datetime.js';
import { isChatArchived, isGroupChat, isAuthorizedNumber } from '../services/chat.js';

/**
 * Un flujo conversacion que responder a las palabras claves relacionadas con la barbería
 */
export default BotWhatsapp.addKeyword(['barberia', 'corte', 'turno', 'barba'])
    .addAction(
        async (ctx, { flowDynamic, endFlow, state }) => {
            try {
                // Verificar si es un grupo
                if (isGroupChat(ctx)) {
                    console.log(`[GRUPO 👩🏽‍🤝‍🧑🏾👩🏽‍🤝‍🧑🏾]: Mensaje ignorado de ${ctx.from}`);
                    return;
                }

                // Verificar si el número está autorizado
                if (!isAuthorizedNumber(ctx.from)) {
                    console.log(`[NO AUTORIZADO ❌❌]: Mensaje ignorado de ${ctx.from}`);
                    return;
                }

                // Verificar si el chat está archivado
                const isArchived = await isChatArchived(ctx, state);
                if (isArchived) {
                    console.log(`[CHAT ARCHIVADO 📂📂]: Mensaje ignorado de ${ctx.from}`);
                    return;
                }

                const name = ctx.body || 'Amigo';

                // Recuperar historial previo (si existe) para usarlo también al confirmar
                const prevState = state.getMyState<{ chatHistory?: Message[]; pendingStartDate?: string; pendingDisplay?: string; awaitingName?: boolean; pendingName?: string; pendingDayOffset?: number }>() || {};
                const prevHistory = Array.isArray(prevState.chatHistory) ? prevState.chatHistory : [];
                const pendingStartDate = prevState.pendingStartDate as string | undefined;
                const pendingDisplay = prevState.pendingDisplay as string | undefined;
                const awaitingName = Boolean(prevState.awaitingName);
                const pendingName = prevState.pendingName as string | undefined;
                const pendingDayOffset = typeof prevState.pendingDayOffset === 'number' ? prevState.pendingDayOffset : undefined;

                // Si estamos esperando que el usuario nos diga su nombre
                if (awaitingName && pendingStartDate) {
                    const providedName = (ctx.body || '').trim();
                    if (!providedName) {
                        await flowDynamic([{ body: '¿Cómo es tu nombre?' }]);
                        return;
                    }
                    // Verificar disponibilidad y agendar
                    const availability = await checkAvailabilityWithMake(pendingStartDate);
                    if (!availability.available) {
                        await state.update({ awaitingName: false, pendingName: undefined });
                        await flowDynamic([{ body: 'No hay disponibilidad para ese horario. ¿Querés probar otro?' }]);
                        return;
                    }
                    const payload = {
                        from: ctx.from,
                        message: ctx.body,
                        history: prevHistory,
                        timestamp: new Date().toISOString(),
                        name: providedName,
                        startDate: pendingStartDate
                    };
                    await sendBookingToMake(payload);
                    await flowDynamic([{ body: `¡Turno confirmado para ${pendingDisplay}! ✂️ Te esperamos, ${providedName}.` }]);
                    state.clear();
                    endFlow();
                    return;
                }

                // Detectar hints de día y presencia de hora en este mensaje
                const body = (ctx.body || '').toLowerCase();
                const hasManana = /\bma[ñn]ana\b/.test(body);
                const hasPasadoManana = /pasado\s*ma[ñn]ana|despu[eé]s\s*de\s*ma[ñn]ana/.test(body);
                const hasHoy = /\bhoy\b/.test(body);
                const hasTime = /\b(\d{1,2})(?:[:h\.]\d{2})?\s*(am|pm|hs|hrs|h)?\b/.test(body);

                // Si el usuario indica sólo día sin hora: guardar offset y pedir horario
                if (!hasTime && (hasManana || hasPasadoManana || hasHoy)) {
                    const offset = hasPasadoManana ? 2 : hasManana ? 1 : 0;
                    await state.update({ pendingDayOffset: offset });
                    await flowDynamic([{ body: 'Genial. ¿Qué horario te viene bien? (por ejemplo: 14:00 o 2pm)' }]);
                    return;
                }

                // Intentar parsear fecha/hora natural en el mensaje aplicando offset de día guardado (si existe)
                const parsed = parseSpanishDateTime(ctx.body || '', new Date(), pendingDayOffset);
                if (parsed && !pendingStartDate) {
                    // Aceptar solo minutos :00 o :30
                    const minutes = new Date(parsed.iso).getMinutes();
                    if (minutes !== 0 && minutes !== 30) {
                        await flowDynamic([{ body: 'Solo tomamos turnos a la hora en punto o y media (por ejemplo: 14:00 o 14:30). Indicá un horario válido, por favor.' }]);
                        return;
                    }
                    await state.update({ pendingStartDate: parsed.iso, pendingDisplay: parsed.display });
                    await flowDynamic([{ body: `¿Confirmás el turno para ${parsed.display}? Responde "sí" o "no".` }]);
                    return;
                }

                // Manejo de confirmación/negación si ya hay una fecha pendiente
                const yesRe = /\b(s[ií]|si|dale|listo|confirmo|confirmado|ok|queda|cerrado)\b/i;
                const noRe = /\b(no|cambiar|otra)\b/i;
                if (pendingStartDate && (yesRe.test(ctx.body || '') || noRe.test(ctx.body || ''))) {
                    if (noRe.test(ctx.body || '')) {
                        await state.update({ pendingStartDate: undefined, pendingDisplay: undefined, awaitingName: false, pendingName: undefined, pendingDayOffset: undefined });
                        await flowDynamic([{ body: 'Entendido. Decime otro día y horario (por ejemplo: "mañana 14:00" o "24/08 10hs").' }]);
                        return;
                    }
                    // Necesitamos el nombre: usar pushName o preguntarlo
                    const candidateName = ctx.pushName || pendingName;
                    if (!candidateName) {
                        await state.update({ awaitingName: true });
                        await flowDynamic([{ body: 'Perfecto. ¿A nombre de quién reservo?' }]);
                        return;
                    }
                    // Verificar disponibilidad y agendar
                    const availability = await checkAvailabilityWithMake(pendingStartDate);
                    if (!availability.available) {
                        await state.update({ pendingStartDate: undefined, pendingDisplay: undefined, awaitingName: false });
                        await flowDynamic([{ body: 'No hay disponibilidad para ese horario. ¿Querés probar otro?' }]);
                        return;
                    }
                    const payload = {
                        from: ctx.from,
                        message: ctx.body,
                        history: prevHistory,
                        timestamp: new Date().toISOString(),
                        name: candidateName,
                        startDate: pendingStartDate
                    };
                    await sendBookingToMake(payload);
                    await flowDynamic([{ body: `¡Turno confirmado para ${pendingDisplay}! ✂️ Te esperamos, ${candidateName}.` }]);
                    state.clear();
                    endFlow();
                    return;
                }

                // Recuperar historial previo y agregar el mensaje actual del usuario
                const history: Message[] = [
                    ...prevHistory,
                    { role: 'user', content: ctx.body }
                ];

                // Obtener respuesta del modelo Gemini
                const response = await run(name, history);

                await flowDynamic(response);

                // Guardar historial incluyendo la respuesta del asistente
                await state.update({ chatHistory: [
                    ...history,
                    { role: 'assistant', content: response }
                ]});
                return;
            } catch (error: unknown) {
                const err = error instanceof Error ? error : undefined;
                console.error('❌ Error en el flujo de chatbot:', {
                    error,
                    stack: err?.stack,
                    from: ctx.from,
                    body: ctx.body
                });
                await flowDynamic([
                    {
                        body: 'Lo siento, hubo un error al procesar tu mensaje. Por favor, inténtalo de nuevo.'
                    }
                ]);
                return;
            }
        }
    )
