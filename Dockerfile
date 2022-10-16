FROM nikolaik/python-nodejs:python3.7-nodejs18-slim

WORKDIR /app

ADD package-lock.json package.json ./
ADD /dist uploads/
RUN npm install

ADD . .

RUN npx prisma generate

RUN npx tsc

CMD [ "node", "dist/index.js"]