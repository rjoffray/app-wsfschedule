# WSF Schedule Project

Coffee Stand Kiosk

## How it's built

We are using the `oak` module to start our app. The current stack is

* express (for local Server)
* stylus (for CSS)
* pug (for Markup)
* angular

### Structure

```text
src/
├─ server.js         // Our main server file
├─ settings.js       // Loads our ENV vars, settings.json, light values, etc
├─ light.js          // Lighting controler, this is a temp location
└─ public/
  ├─ index.css       // Where our stylus compiles to. Don't edit this file
  ├─ font/
  └─ icons/
└─ spec/             // swagger spec lives here, used so we can codegen our assets directory on filesync
└─ views/
  ├─ index.js        // main JS and app logic
  ├─ index.styl      // main CSS
  ├─ index.pug       // main HTML
  ├─ api.service.js  // API provider, getting filesync assets mainly
  └─ ...
```

Inside the `views` directory, we have a number of directories that are routes in the UI. The `.js` files get auto-loaded, but the stylus files are loaded via `views/index.styl`.

## Prepare the API service

The only hard requirement of THD is `filesync` and `oakos-api`. You will want to run `docker-compose up` in this directory. The files will all sync down, and you are good to go. If you can't hit `https://localhost/` after starting the containers, this means you most likely don't have the ports bound, or permissions to bind 443.

```bash
docker-compose up
```

If you are getting impatient, you can watch filesyncs output

```bash
curl -k -X GET --header 'Content-Type: application/json' --header 'Accept: text/html' 'https://localhost/filesync/watch'
```

## Get the app ready

You need to have node installed on your system, we are currently using the same version as [oak](https://github.com/oaklabsinc/oak).

Install our local modules, you should do this only after every git pull. We have `SerialPort` code, so you need to rebuild the node modules with our electron headers as well.

```bash
npm install && npm run rebuild
```

## Start the app

Now you can run the UI

```bash
npm start
```

* Once the UI is up, go ahead and hit `ctrl + shift + i` to open the debugger. 
* Click the top left phone looking icon. That puts us in device simulation mode
* Add a new profile for `1080x1920`
* Select that profile.
* Done!

## Oh noes I have problems!

Open the debugger with `ctrl + shift + i` and click the `console` tab up top.

```text
  Failed to load resource: net:ERR_CONNECTION:REFUSED
```

* The assets might not have finished syncing yet, let them finish up and then refresh the page with `ctrl + r`
* You didnt start the API container, go ahead and make sure you did `docker-compose up`

```text
  Transition Rejection($id: 0 ...
```

* You definitely dont have the API up (or the API couldnt bind to port 80)
