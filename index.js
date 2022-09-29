const FileSystem = require('./fileSystemLib');

async function main() {
    const fileSystem = new FileSystem();
    const elm_path = '/IN/RJ';
    fileSystem.move(elm_path, '/US/LA')
    // fileSystem.create(elm_path, 'FILE');
    // fileSystem.write(elm_path, 'this is a temp file created by me.');
    // fileSystem.rename(elm_path, 'city.txt');

}
main();