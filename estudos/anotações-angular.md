# 🚀 Guia de Criação de Projeto Angular

## 📋 Pré-requisitos

### 🧱 1. Instalar o Node.js

Baixe em: [https://nodejs.org](https://nodejs.org)

Após instalar, verifique no terminal:

```bash
node -v
npm -v
```

✅ Se aparecer a versão, está tudo certo!

---

## ⚙️ 2. Instalar o Angular CLI

```bash
npm install -g @angular/cli
```

Verifique a instalação:

```bash
ng version
```

---

## 📁 3. Criar o Projeto

```bash
ng new nome-da-pasta
```

Durante a criação, responda às perguntas:

| Pergunta | Resposta |
|----------|----------|
| Would you like to add Angular routing? | **Yes** |
| Which stylesheet format? | **CSS** |
| Enable SSR? | **N** |
| Share anonymous usage data? | **N** (ou conforme preferir) |

---

## 📂 4. Entrar na Pasta do Projeto

```bash
cd nome-da-pasta
```

---

## ▶️ 5. Rodar o Projeto

```bash
ng serve
```

> Responda **N** se perguntar sobre analytics.

Abra no navegador:

```
http://localhost:4200
```

🎉 Se aparecer a tela padrão do Angular, o projeto está funcionando!

---

## 🧩 Criar Componentes

Dentro da pasta do projeto, use o Angular CLI para gerar componentes:

```bash
ng g c pages/home
```

### Estrutura gerada:

```
src/app/pages/home/
 ├── home.component.ts       → Lógica do componente
 ├── home.component.html     → Template HTML
 ├── home.component.css      → Estilos CSS
 └── home.component.spec.ts  → Testes unitários
```

### Exemplos de outros componentes:

```bash
ng g c pages/about
ng g c pages/contact
ng g c components/header
ng g c components/footer
```

---

## 🗂️ Estrutura do Projeto

```
nome-da-pasta/
 ├── src/
 │   ├── app/
 │   │   ├── pages/
 │   │   │   └── home/
 │   │   ├── app.component.ts
 │   │   ├── app.component.html
 │   │   ├── app.component.css
 │   │   └── app.routes.ts
 │   ├── index.html
 │   └── main.ts
 ├── angular.json
 ├── package.json
 └── tsconfig.json
```

---

## 📌 Comandos Úteis

| Comando | Descrição |
|---------|-----------|
| `ng serve` | Inicia o servidor de desenvolvimento |
| `ng build` | Compila o projeto para produção |
| `ng g c nome` | Gera um novo componente |
| `ng g s nome` | Gera um novo service |
| `ng g m nome` | Gera um novo módulo |
| `ng test` | Executa os testes unitários |

---

## 🔗 Recursos

- [Documentação oficial do Angular](https://angular.dev)
- [Angular CLI Reference](https://angular.dev/tools/cli)
- [Node.js Download](https://nodejs.org)

---

> Criado como guia de referência rápida para projetos Angular.
