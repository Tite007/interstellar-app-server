# Use the official Node.js image.
FROM node:18

# Create and change to the app directory.
WORKDIR .
# Copy application dependency manifests to the container image.
COPY package*.json ./

# Install dependencies.
RUN npm install

# Copy the rest of the application code to the container image.
COPY . .

ENV HOST 0.0.0.0
ENV PORT 3001

# Expose the port the app runs on
EXPOSE 3001

# Run the Node.js server
CMD ["npm", "start"]