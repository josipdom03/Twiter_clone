# Koristimo stabilnu verziju Node-a
FROM node:18-alpine

# Postavi radni direktorij
WORKDIR /app

# Kopiraj package.json i package-lock.json (ako postoji)
COPY package*.json ./

# Instaliraj dependencije
RUN npm install

# Kopiraj ostatak koda
COPY . .

# Port na kojem API sluša
EXPOSE 3000

# Pokreni aplikaciju
CMD ["npm", "run", "dev"]