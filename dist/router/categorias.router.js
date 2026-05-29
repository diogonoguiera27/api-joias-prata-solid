"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.categoriasRouter = void 0;
const express_1 = require("express");
const categorias_controller_1 = require("../controllers/categorias.controller");
const categoriasRouter = (0, express_1.Router)();
exports.categoriasRouter = categoriasRouter;
categoriasRouter.post("/", (request, response) => {
    return categorias_controller_1.categoriasController.criar(request, response);
});
categoriasRouter.get("/", (request, response) => {
    return categorias_controller_1.categoriasController.listar(request, response);
});
categoriasRouter.get("/slug/:slug", (request, response) => {
    return categorias_controller_1.categoriasController.buscarPorSlug(request, response);
});
categoriasRouter.get("/:id", (request, response) => {
    return categorias_controller_1.categoriasController.buscarPorId(request, response);
});
categoriasRouter.put("/:id", (request, response) => {
    return categorias_controller_1.categoriasController.atualizar(request, response);
});
categoriasRouter.patch("/:id/desativar", (request, response) => {
    return categorias_controller_1.categoriasController.desativar(request, response);
});
categoriasRouter.patch("/:id/ativar", (request, response) => {
    return categorias_controller_1.categoriasController.ativar(request, response);
});
categoriasRouter.delete("/:id", (request, response) => {
    return categorias_controller_1.categoriasController.remover(request, response);
});
