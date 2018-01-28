FROM oaklabs/oak:4.1.1

WORKDIR /data/oak/app
COPY . /data/oak/app

RUN npm i --engine-strict=true --progress=false --loglevel="error" \
    && npm run rebuild \
    && npm cache clean

VOLUME /data/oak/app
CMD ["/data/oak/app"]

ENV NODE_ENV=production
