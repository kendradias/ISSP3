# frontend-app/Dockerfile
FROM node:18-alpine as build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all files
COPY . .

# Set the API URL for production build
ENV VITE_API_URL=http://backend:3000/api/applications

# Build the app (for Vite projects)
RUN npm run build

# Production environment
FROM nginx:alpine

# For Vite, the build output is in 'dist' folder, not 'build'
COPY --from=build /app/dist /usr/share/nginx/html

# Configure nginx for React Router
RUN echo 'server { \
    listen 80; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]