# 1. Koristimo Node 20 (LTS) jer tvoji paketi (jsdom, cheerio) zahtijevaju v20+
FROM node:20-alpine

# 2. Instaliramo sistemske dependencije potrebne za kompajliranje (node-gyp, re2, itd.)
# Alpine koristi 'apk', a ove tri stvari su ključne za "native" pakete
RUN apk add --no-cache python3 make g++

WORKDIR /app

# 3. Kopiramo package fajlove
COPY package*.json ./

# 4. Instalacija (dodao sam i cache clean radi manje slike)
# Koristimo --legacy-peer-deps jer tvoj projekt očito ima verzijske konflikte
RUN npm install --legacy-peer-deps && npm cache clean --force

# 5. Kopiramo ostatak koda
COPY . .

# Vite port
EXPOSE 5173

# Pokretanje
CMD ["npm", "run", "dev", "--", "--host"]