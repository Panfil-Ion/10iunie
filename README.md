# 10 June Sync Protocol

Aplicație web multiplayer 1v1 în timp real — cadou digital cu 6 faze sincronizate.

## Stack

React (Vite) · Tailwind CSS · Framer Motion · Node.js · Socket.io · OpenAI

## Rulare locală

```bash
npm install
npm install --prefix client
npm install --prefix server
npm run dev:server   # terminal 1
npm run dev:client   # terminal 2
```

Deschide `http://localhost:5173?room=nume-camera` pe două dispozitive.

## Deploy Railway

- `OPENAI_API_KEY` — cheia OpenAI
- `NODE_ENV=production`
- Start: `NODE_ENV=production node server/index.js`

Serverul ascultă pe `process.env.PORT`. Imaginile se trimit ca Base64 (fără stocare pe disc).
