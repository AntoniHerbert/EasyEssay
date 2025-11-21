import { Router } from "express";
import { messageStore } from "../storage/"; 
import { insertUserMessageSchema } from "@shared/schema";
import { messageService } from "server/services/message.service";
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
  const { unreadOnly } = req.query;
    
  try {
    const messages = await messageService.getUserMessages(
      req.params.userId,
      req.session.userId!,
      unreadOnly === "true"
    );
    res.json(messages);
  } catch (error: any) {
    if (error.message === "FORBIDDEN_ACCESS") {
      return res.status(403).json({ message: "Forbidden: You can only fetch your own messages" });
    }
    throw error;
  }
}));

/**
 * Envia uma nova mensagem.
 */
router.post("/", catchAsync(async (req, res) => {
  try {
      const message = await messageService.sendMessage(
        req.session.userId!, 
        req.body
      );
      res.status(201).json(message);
    } catch (error: any) {
      if (error.message === "CANNOT_SEND_TO_SELF") {
        return res.status(400).json({ message: "You cannot send a message to yourself" });
      }
      throw error;
    }
}));

/**
 * Marca uma mensagem específica como lida.
 */
router.patch("/:id/read", catchAsync(async (req, res) => {
  try {
      const message = await messageService.markAsRead(
        req.params.id, 
        req.session.userId!
      );
      res.json(message);
    } catch (error: any) {
      if (error.message === "MESSAGE_NOT_FOUND") {
        return res.status(404).json({ message: "Message not found" });
      }
      if (error.message === "FORBIDDEN_ACCESS") {
        return res.status(403).json({ message: "Forbidden" });
      }
      throw error;
    }
}));

export default router;