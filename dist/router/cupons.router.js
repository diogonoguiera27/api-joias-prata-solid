"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cuponsRouter = void 0;
const express_1 = require("express");
const cupons_controller_1 = require("../controllers/cupons.controller");
const cuponsRouter = (0, express_1.Router)();
exports.cuponsRouter = cuponsRouter;
cuponsRouter.post("/", (request, response) => {
    return cupons_controller_1.cuponsController.criar(request, response);
});
cuponsRouter.get("/", (request, response) => {
    return cupons_controller_1.cuponsController.listar(request, response);
});
cuponsRouter.get("/codigo/:codigo", (request, response) => {
    return cupons_controller_1.cuponsController.buscarPorCodigo(request, response);
});
cuponsRouter.post("/aplicar", (request, response) => {
    return cupons_controller_1.cuponsController.aplicar(request, response);
});
cuponsRouter.get("/:id", (request, response) => {
    return cupons_controller_1.cuponsController.buscarPorId(request, response);
});
cuponsRouter.put("/:id", (request, response) => {
    return cupons_controller_1.cuponsController.atualizar(request, response);
});
cuponsRouter.patch("/:id/ativar", (request, response) => {
    return cupons_controller_1.cuponsController.ativar(request, response);
});
cuponsRouter.patch("/:id/desativar", (request, response) => {
    return cupons_controller_1.cuponsController.desativar(request, response);
});
cuponsRouter.delete("/:id", (request, response) => {
    return cupons_controller_1.cuponsController.remover(request, response);
});
