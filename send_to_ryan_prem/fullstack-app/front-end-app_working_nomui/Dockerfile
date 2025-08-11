# Use a lightweight Node.js image
FROM node:18-alpine

# Set working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json first to leverage Docker caching
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application files
COPY . .

# Build the frontend app
RUN npm run build

# Install 'serve' globally to serve the build
RUN npm install -g serve

# Expose port 3000
EXPOSE 3000

# Start the frontend using 'serve'
CMD ["serve", "-s", "dist", "-l", "3000"]
