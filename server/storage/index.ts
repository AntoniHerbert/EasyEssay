import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import pkg from "pg";
const { Pool } = pkg;
import * as schema from "@shared/schema";

import { IUserStore } from './users/user.store';
import { IProfileStore } from './profiles/profile.store'; 
import { IEssayStore } from './essays/essay.store'; 
import { IPeerReviewStore } from './peerReviews/peerReview.store'; 
import { IEssayLikeStore } from './essayLikes/essayLike.store'; 
import { IUserCorrectionStore } from './userCorrections/userCorrection.store'; 
import { IInspirationStore } from './inspirations/inspiration.store'; 
import { IFriendshipStore } from './friendships/friendship.store'; 
import { IMessageStore } from './messages/message.store';

import { UserDbStore } from './users/user.db.store';
import { ProfileDbStore } from './profiles/profile.db.store';
import { EssayDbStore } from './essays/essay.db.store'; 
import { PeerReviewDbStore } from './peerReviews/peerReview.db.store';
import { EssayLikeDbStore } from './essayLikes/essayLike.db.store'; 
import { UserCorrectionDbStore } from './userCorrections/userCorrection.db.store'; 
import { InspirationDbStore } from './inspirations/inspiration.db.store'; 
import { FriendshipDbStore } from './friendships/friendship.db.store'; 
import { MessageDbStore } from './messages/message.db.store'; 

import { UserMemStore } from './users/user.mem.store';
import { ProfileMemStore } from './profiles/profile.mem.store';
import { EssayMemStore } from './essays/essay.mem.store'; 
import { PeerReviewMemStore } from './peerReviews/peerReview.mem.store'; 
import { EssayLikeMemStore } from './essayLikes/essayLike.mem.store';
import { UserCorrectionMemStore } from './userCorrections/userCorrection.mem.store'; 
import { InspirationMemStore } from './inspirations/inspiration.mem.store'; 
import { FriendshipMemStore } from './friendships/friendship.mem.store';
import { MessageMemStore } from './messages/message.mem.store';

export type DrizzleDb = NodePgDatabase<typeof schema>;

let userStore: IUserStore;
let profileStore: IProfileStore; 
let essayStore: IEssayStore; 
let peerReviewStore: IPeerReviewStore;
let essayLikeStore: IEssayLikeStore; 
let userCorrectionStore: IUserCorrectionStore;
let inspirationStore: IInspirationStore; 
let friendshipStore: IFriendshipStore;
let messageStore: IMessageStore; 


if (process.env.NODE_ENV === 'test') {
  console.log("⚡️ [Storage] Usando implementações em MEMÓRIA");
  userStore = new UserMemStore();
  profileStore = new ProfileMemStore();
  essayStore = new EssayMemStore();
  peerReviewStore = new PeerReviewMemStore();
  essayLikeStore = new EssayLikeMemStore();
  userCorrectionStore = new UserCorrectionMemStore();
  inspirationStore = new InspirationMemStore();
  friendshipStore = new FriendshipMemStore();
  messageStore = new MessageMemStore(); 

} else {
  console.log("🗄️ [Storage] Usando implementações de BANCO DE DADOS");

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });

  userStore = new UserDbStore(db);
  profileStore = new ProfileDbStore(db);
  essayStore = new EssayDbStore(db); 
  peerReviewStore = new PeerReviewDbStore(db);
  essayLikeStore = new EssayLikeDbStore(db); 
  userCorrectionStore = new UserCorrectionDbStore(db); 
  inspirationStore = new InspirationDbStore(db); 
  friendshipStore = new FriendshipDbStore(db); 
  messageStore = new MessageDbStore(db); 
}

export {
  userStore,
  profileStore,
  essayStore,
  peerReviewStore,
  essayLikeStore,
  userCorrectionStore,
  inspirationStore,
  friendshipStore,
  messageStore,
};