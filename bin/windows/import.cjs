if (process.platform !== "win32") module.exports = {
    compress  : () => {},
    message   : () => {},
    decompress: () => {},
}; else {
    const { compress, decompress } = require("./ui");
    const { message } = require("./message");

    module.exports = {
        compress,
        message,
        decompress
    };
}
