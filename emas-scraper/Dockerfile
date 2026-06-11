FROM node:20-slim

WORKDIR /app
ENV TZ=Asia/Jakarta

# Instal dependency dulu (cache layer)
COPY package.json ./
RUN npm install --omit=dev

# Salin kode
COPY src ./src

CMD ["node", "src/index.js"]
