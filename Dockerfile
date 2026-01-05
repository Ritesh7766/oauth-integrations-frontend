# ---- build stage ----
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build


# ---- production stage ----
FROM nginx:alpine

# remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# add our config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# copy built files
COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
