FROM node:20-slim AS builder

WORKDIR /app

COPY package*.json .
RUN npm install

COPY . .
RUN npm run build

FROM alpine
COPY --from=builder /app/dist /dist
CMD ["sh", "-c", "cp -r /dist/. /usr/share/nginx/html/"]