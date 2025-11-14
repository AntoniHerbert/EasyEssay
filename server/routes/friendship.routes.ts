import { Router } from "express";
import { storage } from "../storage"; 
import { friendshipStore } from "../storage/"; 
import { insertFriendshipSchema } from "@shared/schema"; 
import { catchAsync } from "./middlewares/errorHandler"; 
import { isAuthenticated } from "./middlewares/isAuthenticated"; 

const router = Router();

// =================================================================
// 🔒 Rotas Protegidas (Exigem login)
// =================================================================

router.use(isAuthenticated);

/**
 * Busca amizades para um usuário específico.
 * @query status {string} (opcional) Filtra por status (ex: 'pending', 'accepted').
 */
router.get("/:userId", catchAsync(async (req, res) => {
  // TODO: Verificação de Segurança Opcional:
  // Você quer que qualquer usuário logado veja a lista de amigos de outro?
  // Se não, adicione uma verificação:
  // if (req.params.userId !== req.session.userId) {
  //   return res.status(403).json({ message: "Forbidden: You can only view your own friendships" });
  // }
  
  const { status } = req.query;
  const friendships = await storage.getFriendships(
    req.params.userId,
    status as string
  );
  res.json(friendships);
}));

/**
 * Cria um novo pedido de amizade.
 * O 'requesterId' é pego automaticamente da sessão do usuário logado.
 */
router.post("/", catchAsync(async (req, res) => {
  const friendshipData = insertFriendshipSchema
    .omit({ requesterId: true })
    .parse(req.body);

  // Impede que o usuário envie um pedido para si mesmo
  if (friendshipData.addresseeId === req.session.userId!) {
     return res.status(400).json({ message: "You cannot send a friend request to yourself" });
  }

  // TODO: Verificar se já existe uma amizade ou pedido pendente
  
  const friendship = await storage.createFriendship({
    ...friendshipData,
    requesterId: req.session.userId!,
  });
  res.status(201).json(friendship);
}));

/**
 * Atualiza uma amizade (ex: aceitar, recusar ou bloquear um pedido).
 */
router.put("/:id", catchAsync(async (req, res) => {
  // TODO: VERIFICAÇÃO DE SEGURANÇA CRÍTICA!
  // Você DEVE verificar se o usuário logado (req.session.userId)
  // é o 'addresseeId' (destinatário) deste pedido de amizade.
  // Caso contrário, qualquer usuário logado pode aceitar o pedido de amizade de outra pessoa.
  
  // Exemplo de verificação:
  // const friendshipToUpdate = await storage.getFriendshipById(req.params.id); // Você pode precisar criar este método
  // if (!friendshipToUpdate) {
  //   return res.status(404).json({ message: "Friendship not found" });
  // }
  // if (friendshipToUpdate.addresseeId !== req.session.userId) {
  //   return res.status(403).json({ message: "Forbidden: You cannot update this friendship request" });
  // }

  const updates = insertFriendshipSchema.partial().parse(req.body);
  const friendship = await storage.updateFriendship(req.params.id, updates);

  if (!friendship) {
    return res.status(404).json({ message: "Friendship not found" });
  }
  res.json(friendship);
}));

// TODO: Você pode querer adicionar uma rota DELETE para remover/cancelar amizades
// router.delete("/:id", catchAsync(async (req, res) => { ... }));

export default router;