FROM oaklabs/oak:5.0.9

# all COPY and RUN commands are relative to this path now
WORKDIR /app

# copy just the package and lockfile, so the layer gets cached (no need to rebuild the layer if it doesn't change)
COPY package.json /app

# we do --production flag on npm so that we dont get devDependancies
RUN npm install \
   --production \
   --progress=false \
   --loglevel="error"

# copy the rest of the app, now that all the node modules are installed
COPY src /app/src

# by default in the oak container, ENTRYPOINT ["oak"], which uses the global oak module
CMD ["/app/src/index.js"]

ENV NODE_ENV=production
