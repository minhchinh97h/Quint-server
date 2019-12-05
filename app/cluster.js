const cluster = require("cluster")
const os = require("os")

const CPUs = os.cpus()


if (cluster.isMaster) {
    let number_of_workers = CPUs.length

    for (let i = 0; i < number_of_workers; i++) {
        cluster.fork();
    }

    cluster.on("listening", function(worker) {
        // console.log("Worker %d connected", worker.process.pid)
    })
    cluster.on("disconnect", function(worker) {
        // console.log("Worker %d disconnected", worker.process.pid)
    })
    cluster.on("exit", function(worker) {
        // console.log("Worker %d is dead", worker.process.pid);

        // Ensuring a new cluster will start if an old one dies
        cluster.fork();
    });
} else {
    require("./server.js");
}