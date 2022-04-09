const os = require('os');
const cluster = require('cluster');

const polka = require('polka');
    
const serve = require('serve-static')('.');

const port = 3000;

if(cluster.isMaster) {
    var numWorkers = 2; // os.cpus().length;

    console.log('Master cluster setting up ' + numWorkers + ' workers...');

    for(var i = 0; i < numWorkers; i++) {
        cluster.fork();
    }

    cluster.on('online', function(worker) {
        console.log('Worker ' + worker.process.pid + ' is online');
    });

    cluster.on('exit', function(worker, code, signal) {
        console.log('Worker ' + worker.process.pid + ' died with code: ' + code + ', and signal: ' + signal);
        console.log('Starting a new worker');
        cluster.fork();
    });
} else {

    const app = polka({onNoMatch: serve});
    
    app.get('/users/:id', (req, res) => {
        res.end(`User: ${req.params.id}`);
    });
    
    app.listen(port, () => {
    
    });    
}