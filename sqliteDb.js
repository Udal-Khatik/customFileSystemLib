const sqlite3 = require('sqlite3').verbose();

/* 
table create query:-
create table fileSystem (
    id INTEGER PRIMARY KEY AUTOINCREMENT, 
    file_name varchar(255) UNIQUE NOT NULL,
    content TEXT default NULL,
    created_at timestamp default (strftime('%s', 'now')),
    updated_at timestamp default (strftime('%s', 'now'))
    );
*/

/*
trigger for update:-
create trigger update_timestamp
    AFTER UPDATE
    ON fileSystem
    BEGIN       
    UPDATE fileSystem SET updated_at=(strftime('%s', 'now')) where id=new.id;
    END;
*/

function SqliteDatabase() {
    this.connect = () => {
        this.db = new sqlite3.Database('./fileSystem.db', sqlite3.OPEN_READWRITE, (err) => {
            if (err) {
              console.error(err.message);
            }
            console.log('Connected to the file system database.');
        });
    }

    this.create = (fileName) => {
        this.connect();
        const sqlQuery = 'INSERT INTO fileSystem (file_name) values (?);';
        this.db.run(sqlQuery, [fileName], (err)=> {
            if(err) {
                console.log(err.message)
                return false;
            };
            console.log('row created in db!');
            return true;;
        })
        this.db.close();
    }

    this.updateContent = (fileName, string_content) => {
        this.connect();
        const sqlQuery = 'UPDATE fileSystem SET content=? WHERE file_name=?;';
        this.db.run(sqlQuery, [string_content, fileName], (err)=> {
            if(err) {
                console.log(err);
                return false;
            }
            return true;
        })
        this.db.close();
    }

    this.updateFileName = (fileName, newFileName) => {
        this.connect();
        const sqlQuery = 'UPDATE fileSystem SET file_name=? WHERE file_name=?;';
        this.db.run(sqlQuery, [newFileName, fileName], (err)=> {
            if(err) {
                console.log(err);
                return false;
            }
            return true;
        })
        this.db.close();
    }

    this.delete = (fileName) => {
        this.connect();
        const sqlQuery = 'DELETE FROM fileSystem WHERE file_name=?;'
        this.db.run(sqlQuery, [fileName], (err) => {
            if(err){
                console.log(err);
                return false;
            }
            console.log(`${fileName}, file deleted!`);
            return true;
        })
        this.db.close();
    }

    this.mtime = (fileName) => {
        this.connect();
        const sqlQuery = 'select updated_at from fileSystem where file_name=?';
        const db = this.db;
        return new Promise(function(resolve,reject){
            db.all(sqlQuery, [fileName], function(err,rows){
               if(err){return reject(err);}
               resolve(rows);
             });
        });
    }
    
    this.ctime = async (fileName) => {
        this.connect();
        const sqlQuery = 'select created_at from fileSystem where file_name=?';
        const db = this.db;
        return new Promise(function(resolve,reject){
            db.all(sqlQuery, [fileName], function(err,rows){
               if(err){return reject(err);}
               resolve(rows);
             });
        });
    }
}

module.exports = SqliteDatabase;