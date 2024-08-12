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

# Install Ollama
RUN curl -fsSL https://ollama.com/install.sh | sh

# Make sure the script has the correct permissions
RUN chmod +x /usr/local/bin/ollama

# Expose the port the app runs on
EXPOSE 3000

# Define the command to run the app
CMD ["node", "server.js"]
