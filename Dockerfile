FROM node:24-alpine
WORKDIR /app
COPY --chown=node:node . .
RUN mkdir -p /app/runtime && chown node:node /app/runtime
USER node
ENV NODE_ENV=production HOST=0.0.0.0 PORT=8080 LOBBY_DATA_DIR=/app/runtime
EXPOSE 8080
VOLUME ["/app/runtime"]
CMD ["node", "standalone/server.mjs"]
