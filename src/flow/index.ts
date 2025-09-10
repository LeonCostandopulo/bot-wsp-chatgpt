import BotWhatsapp from '@bot-whatsapp/bot';
import helloFlow from './hello.flow.js';
import welcomeFlow from './welcome.flow.js';
import chatbotFlow from './chatbot.flow.js';
import nodeFlow from './node.flow.js';

/**
 * Debes de implementar todos los flujos
 */
export default BotWhatsapp.createFlow([
    helloFlow,
    welcomeFlow,
    chatbotFlow,
    nodeFlow
]);