# Prebaci na verziju 20 jer ti paketi to traže
FROM node:20-alpine

# Instaliraj alate za kompajliranje re2 paketa
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Kopiraj package fajlove
COPY package*.json ./

# Instaliraj uz ignoriranje peer-deps konflikata
RUN npm install --legacy-peer-deps

# Kopiraj ostatak koda
COPY . .

# Backend port (vjerojatno 3000 ili 5000, provjeri svoj kod)
EXPOSE 5000

CMD ["npm", "start"]