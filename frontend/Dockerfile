# Stage 1: Build the React static bundle
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Set Vite environment variable to use relative API routing (proxied by Nginx)
ENV VITE_API_URL=/api/v1
RUN npm run build

# Stage 2: Serve using Nginx server
FROM nginx:1.25-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
