FROM node:22-alpine
WORKDIR /app
COPY . .
ENV DATA_DIR=/data TRUST_PROXY=1
EXPOSE 3000
CMD ["node", "server.js"]