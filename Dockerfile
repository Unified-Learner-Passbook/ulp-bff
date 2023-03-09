FROM node:16 as dependencies
WORKDIR /app
COPY . ./
RUN npm i
RUN apt-get update
RUN apt-get install -y wkhtmltopdf
EXPOSE 3000
CMD ["npm", "start"]
