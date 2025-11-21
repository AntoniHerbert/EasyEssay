import { 
  IUserCorrectionStore 
} from "../storage/userCorrections/userCorrections.store";
import { 
  insertUserCorrectionSchema 
} from "@shared/schema";

export class UserCorrectionService {

    constructor(
    private userCorrectionStore: IUserCorrectionStore,
  ) {}

  /**
   * Busca todas as correções de uma redação específica.
   */
  async getCorrectionsByEssayId(essayId: string) {
    return await this.userCorrectionStore.getUserCorrections(essayId);
  }

  /**
   * Cria uma nova correção para uma redação.
   * Recebe o ID da redação e o corpo da requisição (rawBody).
   */
  async createCorrection(essayId: string, rawBody: unknown) {
    // Regra de Negócio:
    // 1. Mescla o ID da redação (da URL) com o corpo da requisição.
    // 2. Valida tudo usando o schema do Zod.
    const correctionData = insertUserCorrectionSchema.parse({
      ...(rawBody as object),
      essayId: essayId,
    });

    // 3. Persiste no banco
    return await this.userCorrectionStore.createUserCorrection(correctionData);
  }

  // Futuramente, você pode adicionar métodos aqui como:
  // async likeCorrection(id: string) ...
  // async deleteCorrection(id: string) ...
}