import BotWhatsapp from '@bot-whatsapp/bot';
import helloFlow from './hello.flow';
import welcomeFlow from './welcome.flow';
import chatbotFlow from './chatbot.flow';
import nodeFlow from './node.flow';

/**
 * Debes de implementar todos los flujos
 */
export default BotWhatsapp.createFlow([
    helloFlow,
    welcomeFlow,
    chatbotFlow,
    nodeFlow
]);