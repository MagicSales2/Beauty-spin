# Stage 1: Build the React application
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Serve the build output with Nginx on a configurable port
FROM nginx:alpine
# Copy custom nginx configuration to support SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Copy built static files from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Expose standard port internally (can remain 8080 as docker-compose handles host mapping)
EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
