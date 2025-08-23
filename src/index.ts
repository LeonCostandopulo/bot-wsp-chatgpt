import "dotenv/config";
import BotWhatsapp from '@bot-whatsapp/bot';
import database from './database';
import provider from './provider';
import flow from './flow';
import { initServer } from "./services/http";

/**
 * Funcion principal del bot
 */
const main = async () => {
    try {
        console.log('Iniciando el bot...');
        
        const botInstance = await BotWhatsapp.createBot({
            database,
            provider,
            flow
        });

        console.log('Bot inicializado correctamente');
        
        // Iniciar el bot
        botInstance.init();

        // Iniciar el servidor
        initServer(botInstance);
        console.log('Servidor HTTP inicializado');
        
        // Iniciar el proveedor
        await provider.start();
        console.log('Proveedor conectado y listo');

    } catch (error) {
        console.error('❌ Error al iniciar el bot:', error);
        process.exit(1);
    }
};

// Manejar errores no capturados
process.on('unhandledRejection', (reason: unknown) => {
    console.error('🔴 Promesa no manejada:', {
        reason,
        stack: reason instanceof Error ? reason.stack : undefined,
        promise: reason
    });
    process.exit(1);
});

// Manejar excepciones no capturadas
process.on('uncaughtException', (err: Error) => {
    console.error('🔴 Excepción no capturada:', {
        error: err,
        stack: err.stack,
        date: new Date().toISOString()
    });
    process.exit(1);
});

// Iniciar el bot
main().catch((error: unknown) => {
    console.error('❌ Error en la función main:', {
        error,
        stack: error instanceof Error ? error.stack : undefined,
        date: new Date().toISOString()
    });
    process.exit(1);
});