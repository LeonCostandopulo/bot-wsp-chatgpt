import BotWhatsapp from '@bot-whatsapp/bot';
import { generatePrompt } from '../services/openai';
import { isChatArchived, isGroupChat, isAuthorizedNumber } from '../services/chat';

/**
 * Un flujo conversacion que responder a las palabras claves relacionadas con la barbería
 */
export default BotWhatsapp.addKeyword(['barberia', 'corte', 'turno', 'barba'])
    .addAction(
        async (ctx, flow) => {
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
                const isArchived = await isChatArchived(ctx, flow.state);
                if (isArchived) {
                    console.log(`[CHAT ARCHIVADO 📂📂]: Mensaje ignorado de ${ctx.from}`);
                    return;
                }

                const email = ctx.from;
                const name = ctx.body || 'Amigo';
                
                // Generar respuesta usando Gemini
                const prompt = generatePrompt(name);
                
                return prompt;
            } catch (error) {
                console.error('❌ Error en el flujo de chatbot:', {
                    error,
                    stack: error?.stack,
                    from: ctx.from,
                    body: ctx.body
                });
                return 'Lo siento, hubo un error al procesar tu mensaje. Por favor, inténtalo de nuevo.';
            }
        }
    )
