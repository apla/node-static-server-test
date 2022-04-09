## TL;DR

```
git clone https://github.com/apla/node-static-server-test
sudo apt install wrk
cd node-static-server-test
npm i
npm run --silent bench-all
```

### Data used in the article

```
server,var,os,rps
express,,mac,14388.95
express-files,static,mac,10039.27
polka,,mac,39736.39
polka-files,static,mac,22411.12
fastify,,mac,39266.82
fastify-files,static,mac,23271.10
```

```
server,var,os,rps
express,,linux,4804.01
express-files,static,linux,3512.84
express-fixed,fixed,linux,4902.01
polka,,linux,13964.56
polka-files,static,linux,7816.86
polka-fixed,fixed,linux,14142.73
fastify,,linux,13731.78
fastify-files,static,linux,8786.26
```

1K file

```
server,os,rps
nginx,linux,15273.08
express-fixed,linux,1733.78
polka-fixed,linux,3496.40
uws-fixed,linux,2625.79
```

#### Chart software

https://rawgraphs.io

#### uWebSockets.js

