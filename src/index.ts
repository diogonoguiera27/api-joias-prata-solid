import "dotenv/config";
import express from "express";
import cors from "cors";
import { produtosRouter } from "./router/produtos.router";
import { categoriasRouter } from "./router/categorias.router";
import { variacoesProdutoRouter } from "./router/variacoes-produto.router";
import { imagensProdutoRouter } from "./router/imagens-produto.router";
import { movimentacoesEstoqueRouter } from "./router/movimentacoes-estoque.router";
import { clientesRouter } from "./router/clientes.router";
import { carrinhosRouter } from "./router/carrinhos.router";
import { pedidosRouter } from "./router/pedidos.router";
import { pagamentosRouter } from "./router/pagamentos.router";
import { cuponsRouter } from "./router/cupons.router";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (request, response) => {
  return response.json({
    message: "API Joias e Prata SOLID Lab funcionando",
  });
});

app.use("/categorias", categoriasRouter);
app.use("/produtos", produtosRouter);
app.use("/variacoes-produto", variacoesProdutoRouter);
app.use("/imagens-produto", imagensProdutoRouter);
app.use("/movimentacoes-estoque", movimentacoesEstoqueRouter);
app.use("/clientes", clientesRouter);
app.use("/carrinhos", carrinhosRouter);
app.use("/pedidos", pedidosRouter);
app.use("/pagamentos", pagamentosRouter);
app.use("/cupons", cuponsRouter);

const port = process.env.PORT || 3333;

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});