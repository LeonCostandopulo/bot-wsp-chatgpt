import { GoogleGenerativeAI } from '@google/generative-ai';
import { generatePrompt, generatePromptDetermine } from "./prompt";

export interface Message {
    role: 'user' | 'assistant';
    content: string;
}

// Verificar si la API key está definida y tiene el formato correcto
if (!process.env.GOOGLE_AI_API_KEY) {
    console.error('Error: GOOGLE_AI_API_KEY no está definida en las variables de entorno');
    process.exit(1);
}

// Verificar el formato de la API key
const apiKey = process.env.GOOGLE_AI_API_KEY.trim();
if (apiKey.length !== 39 || !apiKey.startsWith('AIza')) {
    console.error('Error: La API key tiene un formato incorrecto. Debe comenzar con "AIza" y tener 39 caracteres.');
    process.exit(1);
}

let model: any = null;

// Función para inicializar el modelo
const initializeModel = async () => {
    try {
        console.log('Iniciando GoogleGenerativeAI con API key:', apiKey.substring(0, 4) + '...' + apiKey.substring(apiKey.length - 4));
        const genAI = new GoogleGenerativeAI(apiKey);
        
        // Usar el modelo Gemini Pro Vision Preview
        model = genAI.getGenerativeModel({ model: "models/gemini-1.5-flash" });
        console.log('Conexión exitosa con el modelo Gemini 1.5 flash');

    } catch (error) {
        console.error('Error al inicializar GoogleGenerativeAI:', error);
        throw error;
    }
};

// Inicializar el modelo al iniciar
initializeModel().catch(error => {
    console.error('Error inicializando el modelo:', error);
    process.exit(1);
});

/**
 * 
 * @param name 
 * @param history 
 */
export const run = async (name: string, history: Message[]): Promise<string> => {
    try {
        console.log('Generando respuesta para:', name);
        const prompt = generatePrompt(name);
        
        console.log('Prompt generado:', prompt);
        console.log('Historial de mensajes:', history);

        if (!model) {
            throw new Error('El modelo no está inicializado');
        }

        try {
            // Formatear los mensajes para Gemini
            const formattedMessages = {
                contents: [
                    {
                        role: 'system',
                        parts: [{ text: prompt }]
                    },
                    ...history.map(msg => ({
                        role: msg.role,
                        parts: [{ text: msg.content }]
                    }))
                ]
            };

            console.log('Mensajes formateados:', formattedMessages);

            const result = await model.generateContent(formattedMessages);
            const response = await result.response;
            
            if (!response) {
                throw new Error('No se recibió respuesta del modelo');
            }

            const text = response.text();
            console.log('Respuesta generada:', text);
            return text;
        } catch (error) {
            console.error('Error en generateContent:', {
                error,
                stack: error?.stack,
                prompt,
                history
            });
            throw new Error('Error generando respuesta: ' + error.message);
        }
    } catch (error) {
        console.error('Error al generar respuesta:', {
            error,
            stack: error?.stack,
            name
        });
        throw error;
    }
}

export const runDetermine = async (history: Message[]): Promise<string> => {
    try {
        const prompt = generatePromptDetermine();
        
        console.log('Prompt determinado:', prompt);
        console.log('Historial de mensajes:', history);

        if (!model) {
            throw new Error('El modelo no está inicializado');
        }

        try {
            // Formatear los mensajes para Gemini (sin rol system)
            const formattedMessages = {
                contents: [
                    {
                        role: 'user',
                        parts: [{ text: prompt }]
                    },
                    ...history.map(msg => ({
                        role: msg.role,
                        parts: [{ text: msg.content }]
                    }))
                ]
            };

            console.log('Mensajes formateados:', formattedMessages);

            const result = await model.generateContent(formattedMessages);
            const response = await result.response;
            
            if (!response) {
                throw new Error('No se recibió respuesta del modelo');
            }

            const text = response.text();
            console.log('Respuesta determinada:', text);
            return text;
        } catch (error) {
            console.error('Error en generateContent:', {
                error,
                stack: error?.stack,
                prompt,
                history
            });
            throw new Error('Error determinando respuesta: ' + error.message);
        }
    } catch (error) {
        console.error('Error al determinar respuesta:', {
            error,
            stack: error?.stack
        });
        throw error;
    }
};

export { generatePrompt, generatePromptDetermine }
