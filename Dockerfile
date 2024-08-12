# Use an official Node.js runtime as a parent image
FROM node:14

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Install Ollama into /tmp directory
RUN curl -fsSL https://ollama.com/install.sh -o /tmp/install-ollama.sh && \
    sh /tmp/install-ollama.sh --prefix=/tmp/ollama

# Add /tmp/ollama/bin to PATH
ENV PATH="/tmp/ollama/bin:$PATH"

# Expose the port the app runs on
EXPOSE 3000

# Define the command to run the app
CMD ["node", "server.js"]
