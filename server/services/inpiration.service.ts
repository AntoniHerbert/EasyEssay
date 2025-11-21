import { IInspirationStore } from "../storage/inspirations/inspiration.store";

export class InspirationService {

    constructor(
    private inspirationStore: IInspirationStore,
  ) {}

  /**
   * Busca inspirações com filtros opcionais.
   */
  async getInspirations(category?: string, type?: string) {

    return await this.inspirationStore.getInspirations(category, type);
  }

  /**
   * Busca uma inspiração pelo ID.
   */
  async getInspirationById(id: string) {
    return await this.inspirationStore.getInspiration(id);
  }


}