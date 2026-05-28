import { Router } from "express";
import { cuponsController } from "../controllers/cupons.controller";

const cuponsRouter = Router();

cuponsRouter.post("/", (request, response) => {
  return cuponsController.criar(request, response);
});

cuponsRouter.get("/", (request, response) => {
  return cuponsController.listar(request, response);
});

cuponsRouter.get("/codigo/:codigo", (request, response) => {
  return cuponsController.buscarPorCodigo(request, response);
});

cuponsRouter.post("/aplicar", (request, response) => {
  return cuponsController.aplicar(request, response);
});

cuponsRouter.get("/:id", (request, response) => {
  return cuponsController.buscarPorId(request, response);
});

cuponsRouter.put("/:id", (request, response) => {
  return cuponsController.atualizar(request, response);
});

cuponsRouter.patch("/:id/ativar", (request, response) => {
  return cuponsController.ativar(request, response);
});

cuponsRouter.patch("/:id/desativar", (request, response) => {
  return cuponsController.desativar(request, response);
});

cuponsRouter.delete("/:id", (request, response) => {
  return cuponsController.remover(request, response);
});

export { cuponsRouter };
