import { Router } from "express";
import { storage } from "../storage"; 
import { messageStore } from "../storage/"; 
import { insertUserMessageSchema } from "@shared/schema"; 
import { catchAsync } from "./middlewares/errorHandler"; 
import { isAuthenticated } from "./middlewares/isAuthenticated"; 

const router = Router();

// =================================================================
// 🔒 Rotas Protegidas (Exigem login)
// =================================================================

router.use(isAuthenticated);

/**
 * Busca mensagens para um usuário.
 * @query unreadOnly {boolean} (opcional) Filtra apenas por mensagens não lidas.
 */
router.get("/:userId", catchAsync(async (req, res) => {
  // TODO: VERIFICAÇÃO DE SEGURANÇA CRÍTICA!
  // Um usuário só deve poder ver suas próprias mensagens.
  if (req.params.userId !== req.session.userId) {
    return res
      .status(403)
      .json({ message: "Forbidden: You can only fetch your own messages" });
  }

  const { unreadOnly } = req.query;
  const messages = await messageStore.getUserMessages(
    req.params.userId,
    unreadOnly === "true"
  );
  res.json(messages);
}));

/**
 * Envia uma nova mensagem.
 * O 'fromUserId' é pego automaticamente da sessão do usuário logado.
 */
router.post("/", catchAsync(async (req, res) => {
  const messageData = insertUserMessageSchema
    .omit({ fromUserId: true })
    .parse(req.body);

  // Impede que o usuário envie uma mensagem para si mesmo
  if (messageData.toUserId === req.session.userId!) {
    return res.status(400).json({ message: "You cannot send a message to yourself" });
  }

  const message = await messageStore.createUserMessage({
    ...messageData,
    fromUserId: req.session.userId!, 
  });
  res.status(201).json(message);
}));

/**
 * Marca uma mensagem específica como lida.
 */
router.patch("/:id/read", catchAsync(async (req, res) => {
  // TODO: VERIFICAÇÃO DE SEGURANÇA CRÍTICA!
  // Você DEVE verificar se o usuário logado (req.session.userId)
  // é o 'toUserId' (destinatário) da mensagem que está sendo marcada como lida.
  
  // Exemplo de verificação:
  // const messageToMark = await storage.getMessageById(req.params.id); // Você pode precisar criar este método
  // if (!messageToMark) {
  //   return res.status(404).json({ message: "Message not found" });
  // }
  // if (messageToMark.toUserId !== req.session.userId) {
  //   return res.status(403).json({ message: "Forbidden: You can only mark your own messages as read" });
  // }

  const message = await messageStore.markMessageAsRead(req.params.id);
  if (!message) {
    return res.status(440).json({ message: "Message not found" });
  }
  res.json(message);
}));

export default router;