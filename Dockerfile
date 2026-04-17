FROM node:20-alpine

RUN apk add --no-cache ffmpeg

WORKDIR /app

COPY package*.json ./

RUN npm install --legacy-peer-deps

COPY . .

RUN npm run build

EXPOSE 3123

ENV NODE_ENV=production
ENV PORT=3123
ENV DATA_DIR_PATH=/data

CMD ["node", "dist/server/main.js"]
