FROM node:18-alpine

WORKDIR /app

# Kopiramo package datoteke i instaliramo dependencije
COPY package*.json ./
RUN npm install --legacy-peer-deps
# Kopiramo ostatak koda
COPY . .

# Vite default port
EXPOSE 5173

# Pokrećemo u dev modu
CMD ["npm", "run", "dev", "--", "--host"]