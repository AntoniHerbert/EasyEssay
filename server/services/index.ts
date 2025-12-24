// 1. Importa as instâncias dos Stores (que vêm do storage/index.ts)
import {
  userStore,
  profileStore,
  essayStore,
  peerReviewStore,
  essayLikeStore,
  inspirationStore,
  friendshipStore,
  messageStore,
  exploreStore,
  transactionManager,
  communityStore,
} from "../storage";

// 2. Importa as Classes dos Serviços
import { AuthService } from "./auth.service";
import { EssayService } from "./essay.service";
import { AiService } from "./ai.service";
import { ProfileService } from "./profile.service";
import { PeerReviewService } from "./peerReview.service";
import { EssayLikeService } from "./essayLike.service";
import { InspirationService } from "./inspiration.service";
import { FriendshipService } from "./friendship.service";
import { MessageService } from "./message.service";
import { ExploreService } from "./explore.service";
import { SocketNotificationService } from "./notifications/socket.notification.service";
import { CommunityService } from "./community.service";

// 3. Instancia os Serviços injetando as dependências na ordem correta
export const notificationService = new SocketNotificationService();
// AiService precisa de essay e peerReview
export const aiService = new AiService(essayStore, peerReviewStore, transactionManager);

// AuthService precisa de user e profile
export const authService = new AuthService(userStore, profileStore, transactionManager);

// EssayService precisa de essay, profile E do aiService (que criamos acima)
export const essayService = new EssayService(essayStore, profileStore, aiService, peerReviewStore, essayLikeStore, transactionManager);

// ProfileService precisa de profile
export const profileService = new ProfileService(profileStore, transactionManager);

// PeerReviewService precisa de peerReview e essay
export const peerReviewService = new PeerReviewService(peerReviewStore, essayStore, transactionManager);

// EssayLikeService precisa de essayLike
export const essayLikeService = new EssayLikeService(essayLikeStore, essayStore, transactionManager);

// InspirationService precisa de inspiration
export const inspirationService = new InspirationService(inspirationStore, transactionManager);

// FriendshipService precisa de friendship
export const friendshipService = new FriendshipService(friendshipStore, profileStore, notificationService, transactionManager);

// MessageService precisa de message
export const messageService = new MessageService(notificationService, messageStore, transactionManager);

export const communityService = new CommunityService(
    communityStore, 
    profileStore, 
    userStore,
    essayStore, 
    peerReviewStore, 
    transactionManager
);

export const exploreService = new ExploreService(exploreStore, transactionManager);