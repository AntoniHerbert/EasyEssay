import type { Request, Response, NextFunction, RequestHandler } from "express";
import { z } from "zod";

// Wrapper para rotas assíncronas
type AsyncRequestHandler = (req: Request, res: Response, next: NextFunction) => Promise<any>;

export const catchAsync = (fn: AsyncRequestHandler): RequestHandler => {
  return (req, res, next) => {
    fn(req, res, next).catch(next); // Passa o erro para o próximo middleware
  };
};

// Manipulador de erro global (você o adicionará ao 'app' principal)
export const globalErrorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error("Unhandled Error:", err.stack);

  // Trata erros de validação do Zod
  if (err instanceof z.ZodError) {
    return res.status(400).json({ message: "Invalid data", errors: err.errors });
  }
  
  // TODO: Adicionar mais tipos de erro (ex: erro do banco de dados)

  // Erro genérico
  res.status(500).json({ message: err.message || "Something went wrong" });
};