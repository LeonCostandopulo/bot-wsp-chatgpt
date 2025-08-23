import BotWhatsapp from '@bot-whatsapp/bot';
import flowDynamic from '../flow';
import { generatePrompt, generatePromptDetermine } from '../services/openai';
import { isChatArchived, isGroupChat } from '../services/chat';

/**
 * Un flujo conversacion que responder a las palabras claves relacionadas con los servicios de la barbería
 */
export default BotWhatsapp.addKeyword(['servicios', 'precios', 'horarios'])
    .addAction(
        async (ctx, flow) => {
            // Verificar si es un grupo
            if (isGroupChat(ctx)) {
                console.log(`[GRUPO]: Mensaje ignorado de ${ctx.from}`);
                return;
            }

            // Verificar si el chat está archivado
            const isArchived = await isChatArchived(ctx, flow.state);
            if (isArchived) {
                console.log(`[CHAT ARCHIVADO]: Mensaje ignorado de ${ctx.from}`);
                return;
            }

            const email = ctx.from;
            const name = ctx.body || 'Amigo';
            
            // Generar respuesta usando Gemini
            const response = await flowDynamic(generatePrompt(name));
            
            return response;
        }
    )
