import { Router,  } from "express";

import { carrinhosController } from "../controllers/carrinhos.controller";

const carrinhosRouter = Router();

carrinhosRouter.post("/", (request, response) => {
  return carrinhosController.criar(request, response);
});

carrinhosRouter.get("/", (request, response) => {
  return carrinhosController.listar(request, response);
});

carrinhosRouter.get("/:id", (request, response) => {
  return carrinhosController.buscarPorId(request, response);
});

carrinhosRouter.post("/:id/itens", (request, response) => {
  return carrinhosController.adicionarItem(request, response);
});

carrinhosRouter.patch("/:id/itens/:itemId", (request, response) => {
  return carrinhosController.atualizarQuantidadeItem(request, response);
});

carrinhosRouter.delete("/:id/itens/:itemId", (request, response) => {
  return carrinhosController.removerItem(request, response);
});


carrinhosRouter.delete("/:id/limpar", (request, response) => {
  return carrinhosController.limpar(request, response);
});

carrinhosRouter.patch("/:id/abandonar", (request, response) => {
  return carrinhosController.abandonar(request, response);
});


export { carrinhosRouter };