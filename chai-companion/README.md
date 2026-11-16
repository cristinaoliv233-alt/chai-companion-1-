# Chai — companheira de IA persistente (protótipo digital)

Protótipo web de uma companheira de IA com personalidade configurável e memória persistente.
É a versão digital de um projeto maior: um dispositivo físico (Raspberry Pi, microfone, coluna e ecrã).

## Arrancar
```bash
npm install
cp .env.example .env     # e preenche ANTHROPIC_API_KEY
npm run dev              # site em http://localhost:5173 (API na porta 3001)
```
Para correr tudo numa só porta: `npm run build && npm start` (http://localhost:3001).
Requer Node 20.6 ou superior.

## Áreas
- **Chat**: conversa com streaming; "lembra-te que…" guarda uma memória.
- **Personalidade**: 7 sliders (humor, carinho, energia, curiosidade, sarcasmo, formalidade, confiança) e descrição em tempo real.
- **Memória**: ver, adicionar, editar e apagar.
- **Configurações**: nome da companheira, nome do utilizador, memória on/off, limpar memórias e conversa.

## Estrutura
```
server/index.js          API Express
server/chat.js           motor de conversa (contexto, memória, streaming)
server/personality.js    sliders → prompt de sistema
server/memory-intent.js  deteção de "lembra-te que…"
server/store.js          armazenamento em data/chai.json (trocar por BD no futuro)
src/                     interface React (páginas em src/pages)
```

## API para o Raspberry Pi
```
POST /api/chat
Accept: application/json
Authorization: Bearer <API_TOKEN>     (só se definires API_TOKEN no .env)
{ "message": "olá" }   →   { "reply": "...", "memory": null | { id, label, content } }
```
Sem `Accept: application/json` a resposta é streaming NDJSON (eventos `memory`, `delta`, `done`, `error`).
Outros endpoints: `/api/profile`, `/api/memories`, `/api/messages`.

## Notas
- `API_TOKEN`: se o definires, o site (que não envia o token) deixa de funcionar; usa-o apenas quando o servidor estiver exposto e só o Raspberry Pi o acede.
- Os dados ficam em `data/chai.json` (ignorado pelo git). Apagar o ficheiro repõe tudo.
- Só são enviadas ao modelo as 60 memórias mais recentes.

## Roadmap
- [ ] Voz (STT/TTS) no Raspberry Pi
- [ ] Ecrã da cápsula física
- [ ] Memórias relevantes por pesquisa semântica
