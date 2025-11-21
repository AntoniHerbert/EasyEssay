import { IMessageStore } from "../storage/messages/message.store";
import { insertUserMessageSchema } from "@shared/schema";
import { encrypt, decrypt } from "../utils/encryption";

export class MessageService {

    constructor(
    private messageStore: IMessageStore,
  ) {}

  /**
   * Busca mensagens de um usuário.
   * Regra de Segurança: Um usuário só pode ver suas próprias mensagens.
   */
  async getUserMessages(targetUserId: string, requestingUserId: string, unreadOnly: boolean) {
    // 1. Validação de Permissão
    if (targetUserId !== requestingUserId) {
      throw new Error("FORBIDDEN_ACCESS");
    }

    // 2. Busca no Store
    const messages = await this.messageStore.getUserMessages(targetUserId, unreadOnly);

    return messages.map(msg => ({
      ...msg,
      content: decrypt(msg.content) // <-- A mágica acontece aqui
    }));
  }

  /**
   * Envia uma mensagem.
   * Regra: Não pode enviar para si mesmo.
   */
  async sendMessage(fromUserId: string, rawBody: unknown) {
    // 1. Validação de Schema
    const messageData = insertUserMessageSchema
      .omit({ fromUserId: true })
      .parse(rawBody);

    // 2. Regra de Negócio
    if (messageData.toUserId === fromUserId) {
      throw new Error("CANNOT_SEND_TO_SELF");
    }

    const encryptedContent = encrypt(messageData.content);

    // 3. Persistência
    return await this.messageStore.createUserMessage({
      ...messageData,
      content: encryptedContent,
      fromUserId,
    });
  }

  /**
   * Marca uma mensagem como lida.
   * Regra: A mensagem deve pertencer ao usuário que está fazendo a requisição (toUserId).
   */
  async markAsRead(messageId: string, requestingUserId: string) {
    // 1. Verificação de Segurança (Workaround)
    // Como o store não tem 'getById', buscamos as mensagens do usuário para ver se esta pertence a ele.
    // Nota: Em um sistema maior, adicionaríamos 'getMessageById' ao store para performance.
    const userMessages = await this.messageStore.getUserMessages(requestingUserId);
    const message = userMessages.find(m => m.id === messageId);

    if (!message) {
 
      throw new Error("MESSAGE_NOT_FOUND");
    }

    // 2. Regra de Integridade
    if (message.toUserId !== requestingUserId) {
      throw new Error("FORBIDDEN_access"); 
    }


    const updated = await this.messageStore.markMessageAsRead(messageId);
    if (!updated) {
      throw new Error("MESSAGE_NOT_FOUND");
    }
    
    return updated;
  }
}