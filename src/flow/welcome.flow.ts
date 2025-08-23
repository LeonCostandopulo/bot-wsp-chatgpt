import BotWhatsapp from '@bot-whatsapp/bot';
import { Message } from '../services/openai';
import { run, runDetermine } from '../services/openai';
import chatbotFlow from './chatbot.flow';
import { isChatArchived, isGroupChat, isAuthorizedNumber } from '../services/chat';

/**
 * Un flujo conversacion que es por defecto cuando no se contienen palabras claves en otros flujos
 */
export default BotWhatsapp.addKeyword([BotWhatsapp.EVENTS.WELCOME])
    .addAction(async (ctx, { gotoFlow }) => {
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
            const isArchived = await isChatArchived(ctx, {});
            if (isArchived) {
                console.log(`[CHAT ARCHIVADO 📂📂]: Mensaje ignorado de ${ctx.from}`);
                return;
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

            // Si no es para el chatbot, responder con un mensaje general
            return {
                text: '¡Hola! 👋 ¿Cómo estás? En Unblessed Barbershop estamos aquí para ayudarte.',
                media: 'https://i.imgur.com/41K73fb.png'
            };
        } catch (error) {
            console.error('❌ Error en el flujo de bienvenida:', {
                error,
                stack: error?.stack,
                from: ctx.from,
                body: ctx.body
            });
            return {
                text: 'Lo siento, hubo un error al procesar tu mensaje. Por favor, inténtalo de nuevo.',
                media: 'https://i.imgur.com/41K73fb.png'
            };
        }
    })
