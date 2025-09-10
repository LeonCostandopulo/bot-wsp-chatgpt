import BotWhatsapp from '@bot-whatsapp/bot';

/**
 * Un flujo conversacion que responder a las palabras claves de saludo
 */
export default BotWhatsapp.addKeyword(['hola', 'buenas', 'saludos'])
    .addAction(async (ctx, { flowDynamic }) => {
        const mediaUrl = process.env.WELCOME_MEDIA_URL;
        const baseMessage = '¡Hola! 👋 ¿Cómo estás? En Unblessed Barbershop estamos aquí para ayudarte con tu próximo corte. ¿Te gustaría saber más sobre nuestros servicios o reservar un turno?';
        const msg = mediaUrl ? { body: baseMessage, media: mediaUrl } : { body: baseMessage };
        await flowDynamic([msg]);
        return;
    })
