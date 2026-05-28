FROM node:20-slim
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy application
COPY server.js ./
COPY public/ ./public/

# Cloud Run sets PORT automatically
ENV PORT=8080
EXPOSE 8080

CMD ["node", "server.js"]
