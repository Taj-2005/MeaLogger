# Simple Dockerfile for deployment
# Build: docker build -t meal-logger-server .
# Run: docker run -p 4000:4000 --env-file .env meal-logger-server

FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (production only)
RUN npm ci --only=production

# Copy application code
COPY . .

# Create logs directory
RUN mkdir -p logs

# Expose port
EXPOSE 4000

# Start server
CMD ["node", "src/index.js"]

