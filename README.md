# node-static-server-test

## Serving static files with Node.JS

Node.js have an internal `http`/`https` module to create a web server.
But almost nobody uses `http.Server` as is, the majority of users
are using `Express.js` either directly or indirectly,
as a part of a framework like `Next.js`.

[Express.js](https://expressjs.com), with its long-lived version 4
is famous for its somewhat low performance. Other projects
like [fastify](https://www.fastify.io)
or [polka](https://github.com/lukeed/polka) have benchmarks
outperforming `Express.js`. I don’t know why `Express` is slower,
maybe because of regex processing of routes?
If you’re using parametric routes like `/users/:userid/entity`
and have no regexp routes, then replacing `Express.js`
with `fastify` or `polka` will add a performance boost to your app.
They are not direct replacements, but you can convert code
if you really need that boost. In the article below benchmarks
shows huge improvement, but in reality, your code will be a limiting
factor to your app performance, and you are unlikely notice any improvement.

While writing this article, I tested many configurations: node http, node http + nginx, node http with unix socket + nginx, nginx keepalive for previous configuration. Even with very short response, protocol overhead not so big to give any performance benefits.

Along with dynamic content, node.js web servers can, obviously,
serve static files. Performance-wise, it is not the best way
to serve static files. Using a separate proxy server
like [nginx](https://www.nginx.com) is much better for that purpose.
Linux systems have several technologies to optimize such tasks.
`sendfile` allows you to stream file contents to the socket
using operating system routines and buffers.
`mmap` can be used to map file contents to the memory
and speed up reading purposes. In addition to the system calls above,
Nginx can use its own caching mechanisms. As your project grows,
you may use AWS/Azure/Google/Cloudflare/whatever CDNs
to distribute static files for users in different regions.
This way you’re trading the cost of running your compute nodes
for cheaper CDN bandwidth.

### Serving static content

Let’s get back to the coding. While you’re writing code for your server,
it’s probably easier to include static file serving into web server code.
And, probably, this should not affect your server performance. Let’s try!

All code snippets and test scripts are available on my GitHub repo https://github.com/apla/node-static-server-test.

![node serve static express polka fastify](./node-serve-static-drop.svg)

>Servers with only dynamic routes (higher bars) and with added file serving routine (lower).

Code for static file serving adopted from those pages:

 * https://expressjs.com/en/starter/static-files.html
 * https://expressjs.com/en/resources/middleware/serve-static.html
 * https://github.com/lukeed/polka/blob/master/examples/with-serve-static/index.js
 * https://github.com/fastify/fastify-static

Why web server performance suffers from file serving middleware?
Chaining middleware is a way to write asynchronous code the same way
as old synchronous code was written decades ago. Chained middlewares
dissect request bit by bit and made those bits available
before starting the main URL handler in the app. But everything
comes with a cost. Mapping URLs to the file system, checking session
from cookie against a database, parsing request body, and storing uploaded files
in the filesystem consume resources. As an application developer,
you can choose proper way, when you use middleware as a request
processing atoms depending on URL. Or Lazy way, where most middlewares
are just generic request parser/validator/something else
and used like `app.use(middleware)`.

Such a lazy approach leads to running every application middleware
before processing every request.

As you can see on the chart, I’ve added file serving middleware
and they run before request. To send file contents to the user,
the serving routine should make sure the file exists. So, for every request
web server checks if there is file exists. 

### Filesystem callback

But what do I really want, when I add file serving middleware into my app?
I want my dynamic routes processed as usual, but, _if none matches_,
the server should check for the path in the filesystem. Only as a fallback. 

`Express.js` doesn’t have such a handler, but it processes `use` middlewares
as registered by use method. `polka` calls all `use` middlewares at request start,
but have `onNoMatch` handler. `fastify` server page mentions
[setNotFoundHandler](https://www.fastify.io/docs/latest/Reference/Server/#setnotfoundhandler)
with `preValidation` hook on [lifecycle page](https://www.fastify.io/docs/latest/Reference/Lifecycle/#lifecycle).
But I could not find a way to use `fastify-static` with `preValidation` hook.

Results:

![node serve static fixed express polka fastify](./node-serve-static-all.svg)

>File handlers push at the end of middleware list (express)
>or to special _if none matches_ handler (polka). No solution for fastify.

As you can see, proper middleware usage can benefit your app with faster
response times and lower system load. Maybe it’s time to check other
`use`d middlewares and move form validation, body parsing,
and other specific middlewares to the URLs where is needed?

### Existing static middleware

While browsing source files, I discovered some overengineered static handlers:

 * https://github.com/expressjs/serve-static/blob/master/index.js
 * https://github.com/fastify/fastify-static/blob/master/index.js
 * https://github.com/lukeed/sirv/blob/master/packages/sirv/index.js

At least two of them use `send` package

https://github.com/expressjs/serve-static/blob/master/index.js

`serve-static` is default for `Express` and `fastify-static` is default for `fastify`;
those packages are much slower than a real proxy. They must be used only for testing
and light load scenarios, but with a light load, you’re not needed
`ETag`, `Cache-Control` and `Max-Age` headers and other engineering efforts
to optimize file serving. `sirv` package does even more. It caches file stat in memory, without revalidating
when the file changes. I described why those efforts it is not needed at the beginning
of this article. You can trust me, or you check it out for yourself.

![node serve static express polka nginx](./node-serve-static-nginx.svg)

>Express, polka, and Nginx comparison on 1K file. RPS values differ
from previous charts because benchmarks performed on slower Linux VPS.
I did it on purpose to limit all servers to using only one available CPU core.

Before writing this article I’ve
[seen](https://www.reddit.com/r/node/comments/cu74cz/explain_me_serving_static_files_in_express_in_an/)
[many](https://hashnode.com/post/why-is-it-not-recommended-to-serve-static-files-from-nodejs-ciibz8flv01duj3xt4lxuomp3)
[questions](https://stackoverflow.com/questions/9967887/node-js-itself-or-nginx-frontend-for-serving-static-files)
it is good or not to use Node.JS as http file server. And I have
no definitive answer on how much difference I will have. I always used Nginx
before node.js to serve static in world-facing services. 

### More bad examples

Take a look at Nest.js web server. When the file serving option is turned on, it not only slows down your app because [filesystem checks for every request](https://github.com/nestjs/serve-static/blob/master/lib/loaders/express.loader.ts) but also using [synchronous fs.stat](https://github.com/nestjs/serve-static/commit/532ca9047bc40efeb00f5f0aae3ab7f194097c9b) to check if the file exists.

## Conclusion

You definitely should not have to use node.js for static files in production. And it is better to use that functionality only in development because on every unknown dynamic route your web server will check the filesystem. But the main point of this article is that wrongly placed middleware can hurt the performance of your app.

### P.S.: Best performance at any cost

If you want the best performance at any cost, take a look at uWebSockers.js.
This is very fast web server, developed by Alex Hultman.

On my benchmark uWebSockets.js can handle 74527.95 requests per second with single process, while cluster of two polka nodes just 63141.36. Additional performance can be squeezed from node `http`, but load balancing is a [known linux problem](https://blog.cloudflare.com/the-sad-state-of-linux-socket-balancing/).

File serving doesn't need any workarounds because [of good routes handling](https://github.com/uNetworking/uWebSockets/blob/master/misc/READMORE.md).

>Pattern matching
>
>Routes are matched in order of specificity, not by the order you register them:
>
>Highest priority - static routes, think "/hello/this/is/static".
>Middle priority - parameter routes, think "/candy/:kind", where >value of :kind is retrieved by req.getParameter(0).
>Lowest priority - wildcard routes, think "/hello/*".
>In other words, the more specific a route is, the earlier it will match. This allows you to define wildcard routes that match a wide >range of URLs and then "carve" out more specific behavior from that.

But static serving performance is not so good (10K file):

polka-cluster 17778.46 RPS
uwf-fixed 9023.0 RPS

I have not added this server to compare because the author has his reasons and way of doing things. For example:

 * npm drama: npm wouldn't allow developer to delete previous versions of his package that had bugs and security issues so he got angry and released an empty package with a patch version. npm tagged `latest` latest non-empty package because people complain after suddenly webserver stopper to work. After that, developer deprecated the package ([removed reddit post](https://www.reddit.com/r/node/comments/91kgte/uws_has_been_deprecated/)); https://medium.com/@rockstudillo/beware-of-uwebsockets-js-b51c92cac83f
https://alexhultman.medium.com/beware-of-tin-foil-hattery-f738b620468c
 * [nodejs drama](https://github.com/uNetworking/uWebSockets.js/discussions/171): developer doesn't want to comply with existing nodejs interfaces with it's own nodejs package. «What Node.js does with their streams has no significance to this project. If you see similarities - good - but that doesn't mean anything more than that there are similarities. The entire premise, the hypothesis of this project since day 1 has always been and will continue to be: "Node.js is doing things unreasonably inefficient." In other words - the difference between this project and Node.js is no act of random.»
 * another npm drama: https://github.com/uNetworking/uWebSockets.js/discussions/413
 * Freedom truckers convoy icon on Github profile. Does he support only AntiCovid hysteria or horn punishment for Ottawa citizens too?

To me, this developer is in the good company of authors of `leftpad`, `event-stream`, `node-ipc`. I don't trust `uWebSockets.js` author and I will never use it in my projects.