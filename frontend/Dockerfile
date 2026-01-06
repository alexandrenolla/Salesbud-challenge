FROM node:20-alpine

WORKDIR /app

# Note: npm install is handled at runtime via docker-compose entrypoint
# to support monorepo workspace dependencies

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host"]
