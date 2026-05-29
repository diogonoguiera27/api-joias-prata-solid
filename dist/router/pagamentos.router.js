"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pagamentosRouter = void 0;
const express_1 = require("express");
const pagamentos_controller_1 = require("../controllers/pagamentos.controller");
const pagamentosRouter = (0, express_1.Router)();
exports.pagamentosRouter = pagamentosRouter;
pagamentosRouter.post("/", (request, response) => {
    return pagamentos_controller_1.pagamentosController.criar(request, response);
});
pagamentosRouter.get("/", (request, response) => {
    return pagamentos_controller_1.pagamentosController.listar(request, response);
});
pagamentosRouter.get("/:id", (request, response) => {
    return pagamentos_controller_1.pagamentosController.buscarPorId(request, response);
});
pagamentosRouter.patch("/:id/aprovar", (request, response) => {
    return pagamentos_controller_1.pagamentosController.aprovar(request, response);
});
pagamentosRouter.patch("/:id/recusar", (request, response) => {
    return pagamentos_controller_1.pagamentosController.recusar(request, response);
});
pagamentosRouter.patch("/:id/cancelar", (request, response) => {
    return pagamentos_controller_1.pagamentosController.cancelar(request, response);
});
pagamentosRouter.patch("/:id/reembolsar", (request, response) => {
    return pagamentos_controller_1.pagamentosController.reembolsar(request, response);
});
