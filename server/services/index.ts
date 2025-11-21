// 1. Importa as instâncias dos Stores (que vêm do storage/index.ts)
import {
  userStore,
  profileStore,
  essayStore,
  peerReviewStore,
  essayLikeStore,
  userCorrectionStore,
  inspirationStore,
  friendshipStore,
  messageStore
} from "../storage";

// 2. Importa as Classes dos Serviços
import { AuthService } from "./auth.service";
import { EssayService } from "./essay.service";
import { AiService } from "./ai.service";
import { ProfileService } from "./profile.service";
import { PeerReviewService } from "./peerReview.service";
import { UserCorrectionService } from "./userCorrection.service";
import { EssayLikeService } from "./essayLike.service";
import { InspirationService } from "./inspiration.service";
import { FriendshipService } from "./friendship.service";
import { MessageService } from "./message.service";

// 3. Instancia os Serviços injetando as dependências na ordem correta

// AiService precisa de essay e peerReview
export const aiService = new AiService(essayStore, peerReviewStore);

// AuthService precisa de user e profile
export const authService = new AuthService(userStore, profileStore);

// EssayService precisa de essay, profile E do aiService (que criamos acima)
export const essayService = new EssayService(essayStore, profileStore, aiService);

// ProfileService precisa de profile
export const profileService = new ProfileService(profileStore);

// PeerReviewService precisa de peerReview e essay
export const peerReviewService = new PeerReviewService(peerReviewStore, essayStore);

// UserCorrectionService precisa de userCorrection
export const userCorrectionService = new UserCorrectionService(userCorrectionStore);

// EssayLikeService precisa de essayLike
export const essayLikeService = new EssayLikeService(essayLikeStore);

// InspirationService precisa de inspiration
export const inspirationService = new InspirationService(inspirationStore);

// FriendshipService precisa de friendship
export const friendshipService = new FriendshipService(friendshipStore);

// MessageService precisa de message
export const messageService = new MessageService(messageStore);