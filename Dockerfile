FROM nikolaik/python-nodejs:python3.7-nodejs18-slim
RUN apt-get update && apt-get install -y ca-certificates
WORKDIR /app

ADD package-lock.json package.json ./
ADD /dist uploads/
RUN npm install

ADD . .

RUN npx prisma generate

RUN npx tsc

CMD [ "node", "dist/index.js"]