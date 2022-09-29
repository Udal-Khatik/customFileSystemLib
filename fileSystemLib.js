const fs = require('fs');
const SqliteDatabase = require('./sqliteDb');
const sqliteDatabase = new SqliteDatabase();
const path = require('path');
const baseDir = './rootFolder';


let filesToDelete = [];
function getAllFilesRecursively(directory) {
    fs.readdirSync(directory).forEach(File => {
        const Absolute = path.join(directory, File);
        if (fs.statSync(Absolute).isDirectory()) return getAllFilesRecursively(Absolute);
        else return filesToDelete.push(Absolute);
    });
}

function copyFileSync(source, target) {

    var targetFile = target;
    // if target -> directory, then create new file with same name
    if (fs.existsSync(target)) {
        if (fs.lstatSync(target).isDirectory()) {
            targetFile = path.join(target, path.basename(source));
        }
    }

    fs.writeFileSync(targetFile, fs.readFileSync(source));
}

function copyFolderRecursiveSync(source, target) {
    var files = [];
    // if folder doesn't exist then create one
    var targetFolder = path.join(target, path.basename(source));
    if (!fs.existsSync(targetFolder)) {
        fs.mkdirSync(targetFolder);
    }
    // copy logic
    if (fs.lstatSync(source).isDirectory()) {
        files = fs.readdirSync(source);
        files.forEach(function (file) {
            var curSource = path.join(source, file);
            if (fs.lstatSync(curSource).isDirectory()) {
                copyFolderRecursiveSync(curSource, targetFolder);
            } else {
                copyFileSync(curSource, targetFolder);
            }
        });
    }
}

function FileSystem() {
    this.addBaseDir = (path) => (baseDir + path);

    this.scan = (dir_path) => {
        dir_path = this.addBaseDir(dir_path);
        const fileNamesList = [];
        fs.readdirSync(dir_path).forEach(file => {
            fileNamesList.push(file);
        });
        console.log(fileNamesList);
        return fileNamesList;
    }

    this.create = (elm_path, elm_type) => {
        try {
            elm_path = this.addBaseDir(elm_path);
            if (elm_type === 'FOLDER') {
                fs.mkdirSync(elm_path, { recursive: true });
            }
            else if (elm_type === 'FILE') {
                const { base: fileName, dir } = path.parse(elm_path);
                fs.mkdirSync(dir, { recursive: true });
                fs.closeSync(fs.openSync(elm_path, 'w'));

                // create new row in sqlite db
                if (sqliteDatabase.create(fileName)) {
                    return true;
                };
                return false;
            }
            console.log('succesfully created!\n');
            return true;
        } catch (error) {
            console.log('error while creating file:\n', error);
            return false;
        }
    }

    this.read = (file_path) => {
        file_path = this.addBaseDir(file_path);
        try {
            const text = fs.readFileSync(file_path, { encoding: 'utf8' });
            console.log(text);
            return text;

        } catch (error) {
            console.log('error while reading\n', error);
            return null;
        }
    }

    this.write = (file_path, string_content) => {
        file_path = this.addBaseDir(file_path);
        try {
            fs.writeFileSync(file_path, string_content);

            // update udated_at in sqlite db here
            const { base: fileName } = path.parse(file_path);
            const flag = sqliteDatabase.updateContent(fileName, string_content);
            if (!flag) return false;
            return true;
        } catch (error) {
            console.log(error);
            return false;
        }
    }

    /* 
    incomplete
    @TODO think of proper logic here
    */
    this.move = (elm_path, dir_path) => {
        // check if its file
        elm_path = this.addBaseDir(elm_path);
        dir_path = this.addBaseDir(dir_path);
        fs.mkdirSync(dir_path, { recursive: true });
        const { base, ext } = path.parse(elm_path)
        if (ext.length) {
            // file
            dir_path = path.join(dir_path, base);
            fs.renameSync(elm_path, dir_path);
            return true;
        }
        else {
            // folder
            if (dir_path.includes(elm_path)) {
                console.log('cant move!');
                return false;
            }
            copyFolderRecursiveSync(elm_path, dir_path);
            return true;
        }
    }

    this.rename = (elm_path, new_name) => {
        if (/[\/\\]/g.test(new_name) || /^\.+$/g.test(new_name)) {
            // invalid name
            return false;
        }
        try {
            elm_path = this.addBaseDir(elm_path);
            const { dir, base } = path.parse(elm_path);
            const new_path = path.join(dir, new_name);
            if (fs.existsSync(new_path)) {
                return false;
            }
            fs.renameSync(elm_path, new_path);
            if (sqliteDatabase.updateFileName(base, new_name)) {
                return true;
            }
            return false;
        } catch (error) {
            console.log(error);
            return false;
        }
    }

    this.delete = (elm_path) => {
        elm_path = this.addBaseDir(elm_path);
        const { ext } = path.parse(elm_path)
        if (ext.length) {
            fs.rmdirSync(elm_path, { recursive: true, force: true });
            return true;
        }
        getAllFilesRecursively(elm_path);
        fs.rmdirSync(elm_path, { recursive: true, force: true });

        //delete from database
        filesToDelete.forEach(file => {
            const { base } = path.parse(file);
            sqliteDatabase.delete(base);
        })
    }

    this.mtime = async (file_path) => {
        try {
            file_path = this.addBaseDir(file_path);
            const { base } = path.parse(file_path);
            if (!fs.existsSync(file_path)) {
                return -1;
            }
            const rows = await sqliteDatabase.mtime(base);
            if (rows.length) {
                const { updated_at } = rows[0];
                return updated_at;
            }
            return -1;
        } catch (error) {
            console.log(error);
            return -1;
        }
    }

    this.ctime = async (file_path) => {
        try {
            file_path = this.addBaseDir(file_path);
            const { base } = path.parse(file_path);
            if (!fs.existsSync(file_path)) {
                return -1;
            }
            const rows = await sqliteDatabase.ctime(base);
            if (rows.length) {
                const { created_at } = rows[0];
                return created_at;
            }
            return -1;
        } catch (error) {
            console.log(error);
            return -1;
        }
    }
}

module.exports = FileSystem;