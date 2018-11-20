"use strict"
/**
 * 
 */
class DAOUsers {

    constructor(pool){
        this.pool = pool;
    }

    /**
     * 
     * @param {*} object 
     * @param {*} callback 
     */
    newUser(object, callback){
        this.pool.getConnection((err, callback) =>{
            if(err){
                callback("Error de conexion a la BBDD", undefined);
            }
            connection.query("INSERT INTO users (email, password, name, gender, birthdate, profile_picture, points) VALUES" +
                "(?, ?, ?, ?, ?, ?, ?)", [object.email, object.password, object.name, object.gender, object.birthdate, object.profile_picture, object.points],
                    (err)=>{
                        connection.release();
                        if(err){
                            callback("Error acceso BBDD", false);
                        }
                        else{
                            callback("Usuario insertado correctamente",true);
                        }
            });
        });
    }
/**
     * 
     * @param {*} email 
     * @param {*} password 
     * @param {*} callback 
     */
    isUserCorrect (email, password, callback) {
        this.pool.getConnection((err, connection) => {
            if (err) {
                callback(`Error de conexión: $(err.message)`, undefined); return;
            }
            connection.query("SELECT email, password FROM users WHERE email = ? AND password = ?",
            [email, password],
            (err, rows) => {
                connection.release();
                if (err) {callback (err, undefined); return;}
                if (rows.length() === 0) {
                    callback (null, false);
                }
                else {
                    callback (null, true);
                }
            })
        });
    }

    /**
     * 
     * @param {*} user 
     * @param {*} connection 
     */
    modifyUser(user, connection){

        this.pool.getConnection((err, callback)=>{
            if(err){
                callback("Error de conexion a la BBDD", undefined);
            }
            connection.query("UPDATE users SET email=?, password = ?, name = ?, gender = ?, birthday = ?, profile_picture = ? WHERE email = ?"),
            [user.email, user.password, user.name, user.gender, user.birthday, user.profile_picture, user.email],
            ((err, callback) =>{
                connection.release();
                if(err) {callback(`Error de conexión: $(err.message)`, undefined); return;}
                else callback(null, true);
            });                
        });
    }
    
}

module.export = {
    daoUsers: daoUsers
}