/**
 * Verifica si un chat está archivado
 * @param ctx Contexto del mensaje
 * @param state Estado del bot
 * @returns true si el chat está archivado, false si no
 */
export const isChatArchived = async (ctx: any, state: any): Promise<boolean> => {
    // Verificar si existe un estado de chat archivado de forma segura
    const chatState = state?.getMyState?.()?.chatState ?? {};

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
    
    
    '5491128571905', //mama
    '+5491128571905', 
    
    //'+5491165611373', 
    //'5491165611373',
    // Números utilizados en los tests
    // '5491128571905', //copa
    // '+5491128571905',

    //'5491122367271',//jm
    //'+5491122367271',//jm

    // Agrega aquí los números de teléfono autorizados en formato canónico E.164 (con +)
    // Ejemplo: '+5491112345678',
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
        const base = cleanNumber.replace('+', '');
        const variantsSet = new Set<string>([base, `+${base}`]);

        // Caso Argentina: si empieza con 54 y NO tiene 9, generar variante con 9
        const arMatch = base.match(/^54(?!9)(\d+)/);
        if (arMatch) {
            const withNine = `549${arMatch[1]}`;
            variantsSet.add(withNine);
            variantsSet.add(`+${withNine}`);
        }

        const variants = Array.from(variantsSet);

        // Verificar cada variante
        const isAuthorized = variants.some(variant => AUTHORIZED_NUMBERS.includes(variant));

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
