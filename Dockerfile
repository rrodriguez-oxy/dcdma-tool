# Stage 1: Build Angular
FROM node:22-slim AS build

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
RUN npm run build:prod

# Stage 2: Production
FROM node:22-slim

# Install Oracle Instant Client (required by oracledb)
RUN apt-get update && apt-get install -y libaio1 wget unzip && \
    wget -q https://download.oracle.com/otn_software/linux/instantclient/2350000/instantclient-basiclite-linux.x64-23.5.0.0.0dbru.zip && \
    unzip instantclient-basiclite-linux.x64-23.5.0.0.0dbru.zip -d /opt/oracle && \
    rm instantclient-basiclite-linux.x64-23.5.0.0.0dbru.zip && \
    echo /opt/oracle/instantclient_23_5 > /etc/ld.so.conf.d/oracle-instantclient.conf && \
    ldconfig && \
    apt-get remove -y wget unzip && apt-get autoremove -y && rm -rf /var/lib/apt/lists/*

ENV LD_LIBRARY_PATH=/opt/oracle/instantclient_23_5

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev
COPY server.js .
COPY --from=build /app/dist ./dist

EXPOSE 3000

CMD ["node", "server.js"]
