FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci

# Copy all files
COPY . .

# Build the Next.js application
RUN npm run build

# Set default port and expose it
ENV PORT=3000
EXPOSE ${PORT}

# Start the application
CMD ["sh", "-c", "npm start -- -p ${PORT}"] 