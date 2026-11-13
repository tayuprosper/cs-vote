FROM node:22-alpine

WORKDIR /app

# Only the backend's deps (express, cors) — the ub-vote frontend is deployed
# separately on Vercel and never gets built into this image.
COPY package*.json ./
RUN npm ci --omit=dev

COPY server ./server

ENV NODE_ENV=production
EXPOSE 8080

CMD ["node", "server/index.js"]
