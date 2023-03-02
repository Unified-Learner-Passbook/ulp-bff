#FROM --platform=linux/amd64 node:16 as build
FROM node:14.19.1 as build
WORKDIR /app
RUN chmod 777 -R /app
COPY package*.json ./
RUN npm install
COPY . ./
RUN npm run build && npm prune --production


#FROM --platform=linux/amd64 node:16 as dev 
FROM  public.ecr.aws/docker/library/node:16 as dev
ARG NODE_ENV=dev
ENV NODE_ENV=${NODE_ENV}


# Docker working directory
WORKDIR /app
RUN chmod 777 -R /app
COPY --from=build /app/ /app/
# COPY --from=build /app/node_modules /app/node_modules
# RUN rm -rf /app/dist/migrations/*.d.ts /app/dist/migrations/*.map
# COPY --from=build /app/package.json /app/package.json


RUN ls -l -R



CMD ["node", "dist/main.js"]