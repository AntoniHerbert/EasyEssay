import { IFriendshipStore } from "../storage/friendships/friendship.store";
import { insertFriendshipSchema } from "@shared/schema";

export class FriendshipService {

    constructor(
    private friendshipStore: IFriendshipStore,
  ) {}

  /**
   * Busca amizades de um usuário.
   */
  async getFriendships(userId: string, status?: string) {
    return await this.friendshipStore.getFriendships(userId, status);
  }

  /**
   * Cria um novo pedido de amizade.
   * Regras:
   * 1. Não pode adicionar a si mesmo.
   * 2. Não pode adicionar se já existe amizade (pendente ou aceita).
   */
  async createFriendRequest(requesterId: string, rawBody: unknown) {
    // 1. Validação de Schema
    const friendshipData = insertFriendshipSchema
      .omit({ requesterId: true })
      .parse(rawBody);

    // 2. Regra: Auto-amizade
    if (friendshipData.addresseeId === requesterId) {
      throw new Error("CANNOT_ADD_SELF");
    }

    // 3. Regra: Duplicidade
    // Buscamos as amizades existentes do solicitante para ver se já existe vínculo
    const existingFriendships = await this.friendshipStore.getFriendships(requesterId);
    const alreadyExists = existingFriendships.find(
      f => f.addresseeId === friendshipData.addresseeId || f.requesterId === friendshipData.addresseeId
    );

    if (alreadyExists) {
      throw new Error("FRIENDSHIP_ALREADY_EXISTS");
    }

    // 4. Criação
    return await this.friendshipStore.createFriendship({
      ...friendshipData,
      requesterId,
    });
  }

  /**
   * Atualiza o status de uma amizade (Aceitar/Recusar).
   * Regras:
   * 1. A amizade deve existir.
   * 2. Apenas o DESTINATÁRIO (addressee) pode aceitar/recusar.
   * (Opcional: O remetente poderia cancelar, mas vamos focar no aceite por enquanto).
   */
  async updateFriendshipStatus(friendshipId: string, userId: string, rawBody: unknown) {
    const updates = insertFriendshipSchema.partial().parse(rawBody);

    // 1. Busca a amizade para verificar permissão
    // Como o store não tem getById, usamos um workaround buscando as amizades do usuário
    const userFriendships = await this.friendshipStore.getFriendships(userId);
    const friendship = userFriendships.find(f => f.id === friendshipId);

    if (!friendship) {
      throw new Error("FRIENDSHIP_NOT_FOUND");
    }

    // 2. Regra de Segurança: Só o destinatário pode aceitar/recusar um pedido pendente
    // Se você for o requester, você não pode aceitar seu próprio pedido.
    if (friendship.addresseeId !== userId) {
      throw new Error("FORBIDDEN_UPDATE");
    }

    // 3. Atualiza
    return await this.friendshipStore.updateFriendship(friendshipId, updates);
  }
}