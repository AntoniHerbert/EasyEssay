# Node 20 LTS (compatível com seu código)
FROM node:20-alpine

WORKDIR /app

# Copia package.json
COPY package*.json ./

# Instala dependências
RUN npm install

# Copia o restante do projeto
COPY . .

# Expõe a porta da aplicação
EXPOSE 5000

# Comando para rodar a aplicação
CMD ["npm", "run", "dev"]
