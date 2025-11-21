import { IProfileStore } from "../storage/profiles/profile.store";
import { insertUserProfileSchema } from "@shared/schema";

export class ProfileService {

    constructor(
    private profileStore: IProfileStore,
  ) {}

  /**
   * Busca um perfil pelo ID do usuário.
   */
  async getProfileByUserId(userId: string) {
    return await this.profileStore.getUserProfile(userId);
  }

  /**
   * Cria um novo perfil.
   * ATENÇÃO: Este método contém a lógica legada/insegura que você solicitou manter.
   * Idealmente, deveria validar se o userId corresponde ao usuário logado ou se o perfil já existe.
   */
  async createProfile(rawBody: unknown) {

    const profileData = insertUserProfileSchema
      .omit({ userId: true }) 
      .parse(rawBody);


    const existingProfile = await this.profileStore.getUserProfile(authUserId);
    
    if (existingProfile) {
      throw new Error("PROFILE_ALREADY_EXISTS");
    }

    return await this.profileStore.createUserProfile({
      ...profileData,
      userId: authUserId, 
    });
  }

  /**
   * Atualiza um perfil existente.
   */
  async updateProfile(targetUserId: string, requestingUserId: string, rawBody: unknown) {
    if (targetUserId !== requestingUserId) {
      throw new Error("FORBIDDEN_ACCESS");
    }

    const updates = insertUserProfileSchema.partial().parse(rawBody);

    const updatedProfile = await this.profileStore.updateUserProfile(targetUserId, updates);
    
    if (!updatedProfile) {
      throw new Error("PROFILE_NOT_FOUND");
    }

    return updatedProfile;
  }

  async getAllProfiles() {
    return await this.profileStore.getAllUsers();
  }
}