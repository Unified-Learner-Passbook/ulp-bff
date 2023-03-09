FROM node:16 as dependencies
WORKDIR /app
COPY . ./
RUN npm i
RUN apk add --no-cache wkhtmltopdf
EXPOSE 3000
CMD ["npm", "start"]
