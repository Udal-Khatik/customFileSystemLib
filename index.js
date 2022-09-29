const FileSystem = require('./fileSystemLib');

async function main() {
    const fileSystem = new FileSystem();
    const elm_path = '/IN/KA/capital.txt';
    fileSystem.create(elm_path, 'FILE');
    fileSystem.write(elm_path, 'this is a temp file created by me.');
    // fileSystem.rename(elm_path, 'city.txt');
}
main();