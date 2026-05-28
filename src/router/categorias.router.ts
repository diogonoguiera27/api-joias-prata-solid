import { Router } from "express";
import { categoriasController } from "../controllers/categorias.controller";

const categoriasRouter = Router();

categoriasRouter.post("/", (request, response) => {
  return categoriasController.criar(request, response);
});

categoriasRouter.get("/", (request, response) => {
  return categoriasController.listar(request, response);
});

categoriasRouter.get("/slug/:slug", (request, response) => {
  return categoriasController.buscarPorSlug(request, response);
});

categoriasRouter.get("/:id", (request, response) => {
  return categoriasController.buscarPorId(request, response);
});

categoriasRouter.put("/:id", (request, response) => {
  return categoriasController.atualizar(request, response);
});

categoriasRouter.patch("/:id/desativar", (request, response) => {
  return categoriasController.desativar(request, response);
});

categoriasRouter.patch("/:id/ativar", (request, response) => {
  return categoriasController.ativar(request, response);
});

categoriasRouter.delete("/:id", (request, response) => {
  return categoriasController.remover(request, response);
});

export { categoriasRouter };
