import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { isChatArchived, isAuthorizedNumber, isGroupChat, archiveChat, unarchiveChat } from '../services/chat';

describe('Chat Service', () => {
    describe('isChatArchived', () => {
        test('debería devolver falso cuando no hay estado de chat', async () => {
            const mockCtx = {};
            const mockState = {
                getMyState: jest.fn().mockReturnValue({})
            };
            
            const result = await isChatArchived(mockCtx, mockState);
            expect(result).toBe(false);
            expect(mockState.getMyState).toHaveBeenCalled();
        });

        test('debería devolver verdadero cuando el chat está archivado', async () => {
            const mockCtx = {};
            const mockState = {
                getMyState: jest.fn().mockReturnValue({
                    chatState: { archived: true }
                })
            };
            
            const result = await isChatArchived(mockCtx, mockState);
            expect(result).toBe(true);
        });
    });

    describe('archiveChat', () => {
        test('debería actualizar el estado del chat como archivado', async () => {
            const mockCtx = {};
            const mockUpdate = jest.fn();
            const mockState = {
                update: mockUpdate
            };
            
            await archiveChat(mockCtx, mockState);
            
            expect(mockUpdate).toHaveBeenCalledWith({
                chatState: {
                    archived: true,
                    lastArchived: expect.any(String)
                }
            });
        });
    });

    describe('unarchiveChat', () => {
        test('debería actualizar el estado del chat como no archivado', async () => {
            const mockCtx = {};
            const mockUpdate = jest.fn();
            const mockState = {
                update: mockUpdate
            };
            
            await unarchiveChat(mockCtx, mockState);
            
            expect(mockUpdate).toHaveBeenCalledWith({
                chatState: {
                    archived: false,
                    lastUnarchived: expect.any(String)
                }
            });
        });
    });

    describe('isAuthorizedNumber', () => {
        test('debería autorizar números en la lista de autorizados', () => {
            // Números en diferentes formatos que deberían ser autorizados
            const authorizedNumbers = [
                '5491128571905',
                '+5491128571905',
                '54 9 11 2857-1905',
                '(54) 11-2857-1905'
            ];

            authorizedNumbers.forEach(number => {
                expect(isAuthorizedNumber(number)).toBe(true);
            });
        });

        test('no debería autorizar números que no están en la lista', () => {
            const unauthorizedNumbers = [
                '1234567890',
                '+5491234567890',
                '5491234567890'
            ];

            unauthorizedNumbers.forEach(number => {
                expect(isAuthorizedNumber(number)).toBe(false);
            });
        });
    });

    describe('isGroupChat', () => {
        test('debería detectar correctamente un grupo', () => {
            const groupCtx = {
                isGroup: true,
                from: '1234567890-1234567890@g.us'
            };
            
            expect(isGroupChat(groupCtx)).toBe(true);
        });

        test('debería detectar correctamente un chat individual', () => {
            const privateCtx = {
                isGroup: false,
                from: '1234567890@s.whatsapp.net'
            };
            
            expect(isGroupChat(privateCtx)).toBe(false);
        });
    });
});
