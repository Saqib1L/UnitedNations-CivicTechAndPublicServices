FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY app app
COPY components components
COPY lib lib
COPY tsconfig.json next.config.ts next-env.d.ts ./
ARG API_URL=http://api:8000
ENV API_URL=$API_URL
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
