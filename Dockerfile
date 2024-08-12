# Use an official Node.js runtime as a parent image
FROM node:14

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy the package.json and package-lock.json files
COPY package*.json ./

# Install dependencies
RUN npm install

# Install ollama with root privileges during build
RUN curl -fsSL https://ollama.com/install.sh | sh

# Copy the rest of the application
COPY . .

# Expose the port the app runs on
EXPOSE 3000

# Define environment variables
ENV HOME /usr/src/app
ENV PATH $HOME/bin:$PATH

# Define the command to run the app
CMD ["node", "server.js"]
