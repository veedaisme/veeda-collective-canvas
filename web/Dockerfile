FROM node:20-alpine AS base
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install

FROM base AS dev
WORKDIR /app
COPY . .
# Expose default Vite port
EXPOSE 5173
# Run Vite dev server, accessible from host
CMD ["npm", "run", "dev", "--", "--host"] 