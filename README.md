# Cognira ☁️

**Cognira** é uma plataforma avançada de estudo e memorização ativa, especificamente projetada para profissionais que buscam a certificação **AWS Certified Cloud Practitioner**. 

Diferente de simuladores comuns, o Cognira utiliza um **Motor Cognitivo** baseado em **Repetição Espaçada (SRS - Spaced Repetition System)** para garantir que você não apenas responda perguntas, mas realmente retenha o conhecimento técnico necessário.

---

## 🚀 Principais Funcionalidades

- **🧠 Algoritmo de Memorização Ativa (SRS):** O sistema identifica suas fraquezas e reapresenta os tópicos mais difíceis no momento ideal para consolidar a memória.
- **📊 Dashboard de Domínios:** Visualize seu progresso em tempo real através dos quatro domínios principais da AWS, com indicadores de prontidão (*Readiness*).
- **⚡ Sessões de Estudo Inteligentes:** Gere sessões dinâmicas que priorizam perguntas pendentes ou com as quais você teve dificuldade anteriormente.
- **📈 Feedback Imediato e Reforço:** Errou uma pergunta? O sistema a reintroduz na mesma sessão para garantir o aprendizado imediato.
- **📱 Experiência Mobile-First:** Design moderno e responsivo, otimizado para estudos rápidos em qualquer lugar.

---

## 🛠️ Stack Tecnológica

O projeto foi construído com as tecnologias mais modernas do ecossistema Web:

- **Framework:** [Next.js 15+](https://nextjs.org/) (App Router)
- **Linguagem:** [TypeScript](https://www.typescriptlang.org/)
- **Estilização:** [Tailwind CSS 4](https://tailwindcss.com/)
- **Estado & Lógica:** React 19 Hooks & Context API
- **Arquitetura:** BFF (Backend-for-Frontend) para processamento cognitivo.

---

## 🏗️ Estrutura do Projeto

```text
├── app/                  # Rotas e Páginas (Next.js App Router)
│   ├── api/              # BFF - Endpoints de sessão e progresso
│   ├── dashboard/        # Central de controle de estudos
│   ├── session/          # Interface de execução de questões
│   └── results/          # Análise de performance pós-sessão
├── components/           # Componentes UI reutilizáveis
├── data/                 # Banco de questões e metadados AWS
├── lib/                  # Core Business Logic
│   ├── engine.ts         # Motor de memorização (SRS)
│   ├── storage.ts        # Persistência de dados local
│   └── topics.ts         # Definição da hierarquia AWS
└── public/               # Ativos estáticos e imagens
```

---

## ⚙️ Como Executar

### Pré-requisitos
- Node.js 18.x ou superior
- npm, yarn ou pnpm

### Instalação
1. Clone o repositório:
```bash
git clone https://github.com/seu-usuario/cognira.git
```

2. Instale as dependências:
```bash
npm install
```

3. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

4. Acesse em seu navegador: [http://localhost:3000](http://localhost:3000)

---

## 🗺️ Roadmap de Evolução

- [x] Implementação do Motor Cognitivo (SRS)
- [x] Dashboard por Domínios e Subdomínios
- [x] Sistema de Reforço Imediato de Erros
- [ ] 🚧 Modo Simulado de Exame Original (65 questões/90 min)
- [ ] 🚧 Gráficos de Evolução Temporal
- [ ] 🚧 Exportação de Relatórios de Estudo em PDF

---

## 📄 Licença

Este projeto é de código aberto e está sob a licença MIT.

---

<p align="center">
  Desenvolvido com ❤️ para a comunidade Cloud.
</p>
