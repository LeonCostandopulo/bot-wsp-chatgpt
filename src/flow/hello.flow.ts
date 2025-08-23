import BotWhatsapp from '@bot-whatsapp/bot';

/**
 * Un flujo conversacion que responder a las palabras claves de saludo
 */
export default BotWhatsapp.addKeyword(['hola', 'buenas', 'saludos'])
    .addAction(async (ctx, { gotoFlow }) => {
        return {
            text: '¡Hola! 👋 ¿Cómo estás? En Unblessed Barbershop estamos aquí para ayudarte con tu próximo corte. ¿Te gustaría saber más sobre nuestros servicios o reservar un turno?',
            media: 'https://i.imgur.com/41K73fb.png'
        };
    })
