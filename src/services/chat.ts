/**
 * Verifica si un chat está archivado
 * @param ctx Contexto del mensaje
 * @param state Estado del bot
 * @returns true si el chat está archivado, false si no
 */
export const isChatArchived = async (ctx: any, state: any): Promise<boolean> => {
    // Verificar si existe un estado de chat archivado
    const chatState = state.getMyState()?.chatState ?? {};
    
    // Si no existe estado, asumimos que no está archivado
    if (!chatState.archived) {
        return false;
    }

    // Si el chat está archivado, devolver true
    return true;
};

/**
 * Marca un chat como archivado
 * @param ctx Contexto del mensaje
 * @param state Estado del bot
 */
export const archiveChat = async (ctx: any, state: any): Promise<void> => {
    await state.update({
        chatState: {
            archived: true,
            lastArchived: new Date().toISOString()
        }
    });
};

/**
 * Marca un chat como no archivado
 * @param ctx Contexto del mensaje
 * @param state Estado del bot
 */
export const unarchiveChat = async (ctx: any, state: any): Promise<void> => {
    await state.update({
        chatState: {
            archived: false,
            lastUnarchived: new Date().toISOString()
        }
    });
};

/**
 * Lista de números de teléfono autorizados (temporal para pruebas)
 */
const AUTHORIZED_NUMBERS = [
    '5491128571905',
    '+5491128571905'
    // Agrega aquí los números de teléfono autorizados
    // Ejemplo: '+5491112345678',
    // Puedes agregar más números separados por comas
];

/**
 * Verifica si un número de teléfono está autorizado
 * @param from Número de teléfono del remitente
 * @returns true si está autorizado, false si no
 */
export const isAuthorizedNumber = (from: string): boolean => {
    try {
        // Limpiar el número: eliminar espacios, guiones y paréntesis
        const cleanNumber = from.replace(/[^0-9+]/g, '');
        
        // Crear todas las variantes posibles
        const variants = [
            cleanNumber, // sin prefijos
            `+${cleanNumber.replace('+', '')}`, // con +
            cleanNumber.replace('+', '') // sin +
        ];

        console.log('Verificando número:', {
            original: from,
            limpio: cleanNumber,
            variantes: variants,
            autorizados: AUTHORIZED_NUMBERS
        });

        // Verificar cada variante
        const isAuthorized = variants.some(variant => {
            const isMatch = AUTHORIZED_NUMBERS.includes(variant);
            console.log(`Verificando variante ${variant}: ${isMatch ? '✅' : '❌'}`);
            return isMatch;
        });

        console.log('Resultado final:', {
            numero: from,
            autorizado: isAuthorized,
            variantes: variants
        });

        return isAuthorized;
    } catch (error) {
        console.error('Error al verificar número:', error);
        return false;
    }
};

/**
 * Verifica si el chat es un grupo
 * @param ctx Contexto del mensaje
 * @returns true si es un grupo, false si no
 */
export const isGroupChat = (ctx: any): boolean => {
    // Los grupos de WhatsApp tienen un @g.us en el ID
    return ctx.from.includes('@g.us');
};
