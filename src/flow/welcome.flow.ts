import BotWhatsapp from '@bot-whatsapp/bot';
import { Message } from '../services/openai/index.js';
import { run, runDetermine } from '../services/openai/index.js';
import chatbotFlow from './chatbot.flow.js';
import { isChatArchived, isGroupChat, isAuthorizedNumber } from '../services/chat.js';

/**
 * Un flujo conversacion que es por defecto cuando no se contienen palabras claves en otros flujos
 */
export default BotWhatsapp.addKeyword([BotWhatsapp.EVENTS.WELCOME])
    .addAction(async (ctx, { gotoFlow, flowDynamic, state }) => {
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

            // Si existe un turno en curso (confirmación pendiente o esperando nombre), redirigir al chatbot
            const bookingState = state.getMyState<{ pendingStartDate?: string; awaitingName?: boolean }>() || {};
            if (bookingState.pendingStartDate || bookingState.awaitingName) {
                return gotoFlow(chatbotFlow);
            }

            // Crear historial con el mensaje actual
            const history: Message[] = [
                {
                    role: 'user',
                    content: ctx.body
                }
            ];

            // Determinar si el mensaje es para el chatbot
            const isChatbot = await runDetermine(history);
            console.log('Determinación del mensaje:', {
                mensaje: ctx.body,
                esChatbot: isChatbot
            });

            // Si es un mensaje para el chatbot, pasar al flujo del chatbot
            if (isChatbot.trim() === 'chatbot') {
                return gotoFlow(chatbotFlow);
            }

            // Si no es para el chatbot, responder con un mensaje general usando flowDynamic
            {
                const mediaUrl = process.env.WELCOME_MEDIA_URL;
                const baseMessage = '¡Hola! 👋 ¿Cómo estás? En Unblessed Barbershop estamos aquí para ayudarte.';
                const msg = mediaUrl
                    ? { body: baseMessage, media: mediaUrl }
                    : { body: baseMessage };
                await flowDynamic([msg]);
            }
            return;
        } catch (error: unknown) {
            const err = error instanceof Error ? error : undefined;
            console.error('❌ Error en el flujo de bienvenida:', {
                error,
                stack: err?.stack,
                from: ctx.from,
                body: ctx.body
            });
            {
                const mediaUrl = process.env.WELCOME_MEDIA_URL;
                const baseMessage = 'Lo siento, hubo un error al procesar tu mensaje. Por favor, inténtalo de nuevo.';
                const msg = mediaUrl
                    ? { body: baseMessage, media: mediaUrl }
                    : { body: baseMessage };
                await flowDynamic([msg]);
            }
            return;
        }
    })
