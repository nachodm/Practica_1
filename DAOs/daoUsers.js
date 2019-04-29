"use strict"
/**
 * 
 */
class daoUsers {
    /**
     * Pool de conexiones.
     * @param {*} pool 
     */
    constructor(pool){
        this.pool = pool;
    }

    /**
     * Inserta la información del usuario pasado por parámetro en la base de datos.
     * @param {object} user Objeto usuario a insertar en la base de datos.
     * @param {function} callback Función que devolverá el objeto error o el resultado.
     */
    newUser(user, callback){
        this.pool.getConnection((err, connection) =>{
            if (err) {
                callback("Error de conexion a la BBDD", undefined);
            }
            connection.query("INSERT INTO users (email, password) VALUES (?, ?)",
            [user.email, user.password],
            (err) => {
                    connection.release();
                    if(err){
                        callback("Error acceso BBDD", false);
                    }
                    else {
                        callback(undefined, true);
                    }
            });
        });
    }
    /**
     * Devuelve un booleano tras comprobar si la información de inicio de sesión (email y password) es correcta
     * @param {string} email 
     * @param {string} password 
     * @param {function} callback Función que  devolverá el objeto error o el resultado.
     */
    isUserCorrect (email, password, callback) {
        this.pool.getConnection((err, connection) => {
            if (err) {
                callback(`Error de conexión a la BBDD`, undefined); return;
            }
            connection.query("SELECT email, password FROM users WHERE email = ? AND password = ?",
            [email, password],
            (err, rows) => {
                connection.release();
                if (err) {callback (err, undefined); return;}
                if (rows.length === 0) {
                    callback (null, false);
                }
                else {
                    callback (null, true);
                }
            })
        });
    }

    /**
     * Modifica en la base de datos la información del usuario pasado por parámetro 
     * @param {object} user Usuario a actualizar en la base de datos.
     * @param {function} callback Función que devolverá el objeto error o el booleano indicando la correcta actualización del usuario.
     */
    modifyUser(user, callback){
        this.pool.getConnection((err, connection) => {
            if (err) {
                callback("Error de conexion a la BBDD", undefined); return;
            }
            connection.query("UPDATE users SET email = ?, password = ?, name = ?, gender = ?, birthdate = ?, profile_picture = ? WHERE email = ?",
            [user.email, user.password, user.name, user.gender, user.birthdate, user.profile_picture, user.email],
            (err) => {
                connection.release();
                if (err) {callback(err, undefined); return;}
                else {
                    callback(null, true);
                }
            })
        });
    }

    /**
     * Devuelve un objeto user que contiene la información del usuario al que se desea buscar.
     * @param {String} email Identificador del usuario
     * @param {function} callback Función que devolverá el objeto error o el resultado.
     */
    getUser(email, callback) {
        this.pool.getConnection((err, connection) => {
            if (err) {
                callback(`Error de conexión: $(err.message)`, undefined); return;
            }
            connection.query("SELECT * FROM users WHERE email = ?",
            [email],
            (err, rows) => {
                connection.release();
                if (err) {callback(err, undefined); return;}
                else {
                    let user;
                    if (rows.length > 0) {
                        user = {
                            email: rows[0].email, 
                            name: rows[0].name, 
                            password: rows[0].password,
                            gender: rows[0].gender,
                            birthdate: rows[0].birthdate,
                            profile_picture: rows[0].profile_picture,
                            points: rows[0].points
                        }
                    }
                    if (user !== undefined) { callback(null, user);}
                    else { callback(err, undefined);}
                }
            })
        });
    }

    /**
     * Busca en la base de datos las tuplas de amigos en las que se encuentre el usuario con el email pasado por parámetro.
     * @param {string} email Identificador del usuario conectado.
     * @param {function} callback Función que devolverá el objeto error o el resultado.
     */
    getUserFriends(email, callback) {
        this.pool.getConnection((err, connection) => {
            if (err) {
                callback(`Error de conexión: ${err.message}`, undefined); return;
            }
            connection.query("SELECT user1, name, profile_picture FROM friends JOIN users ON user1 = email WHERE status = 1 AND user2 = ?",
            [email],
            (err, rows) => {
                if (err) {
                    callback(err, undefined);
                    return;
                }
                let friends = [];
                rows.forEach(friend => {
                    friends.push({ name: friend.name, email: friend.user1, picture: friend.profile_picture });
                });
                connection.query("SELECT user2, name, profile_picture FROM friends JOIN users ON user2=email WHERE status = 1 AND user1 = ?",
                [email],
                (err, rows) => {
                    connection.release();
                    if (err) {
                        callback(err, undefined);
                        return;
                    }
                    rows.forEach(friend => {
                        friends.push({ name: friend.name, email: friend.user2, picture: friend.profile_picture });
                    });
                    callback(null, friends);
                })
            })
        })
    }

    /**
     * Función que devuelve las solicitudes de amistad que tiene un usuario
     * @param {String} email email del usuario logueado
     * @param {Function} callback Función que devolverá el objeto error y el resultado
     */
    getFriendRequests(email, callback) {
        this.pool.getConnection((err, connection) => {
            if (err) { 
                callback(`Error de conexión: ${err.message}`, undefined); return;
            } 
            else {
                connection.query("SELECT user1, name, profile_picture FROM friends JOIN users ON email=user1 WHERE status = 0 and user2 = ?", 
                [email],
                (err, rows) => {
                    connection.release();
                    if (err) { callback(err, undefined); return;} 
                    else {
                        let requests = [];
                        rows.forEach(row => {
                            requests.push({ name: row.name, email: row.user1, picture: row.profile_picture });
                        });
                        callback(null, requests);
                    }
                })
            }
        });
    }

     /**
      * Búsqueda de la cadena "string" en la base de datos.
      * @param {String} string cadena de texto para buscar en los nombres de usuario presentes en la base de datos.
      * @param {String} loggedUserEmail email del usuario al que pertenece la sesión
      * @param {Function} callback Función que devolverá el objeto error o el resultado
      */
    search(string, loggedUserEmail, callback) {
        this.pool.getConnection((err, connection) => {
            if (err) {callback(`Error de conexión: ${err.message}`, undefined); return;}
            else {
                connection.query("SELECT email, name, profile_picture FROM users WHERE email != ? AND name LIKE ? AND email NOT IN " +
                "(SELECT user1 FROM friends WHERE user2 = ?) AND email NOT IN " +
                "(SELECT user2 FROM friends WHERE user1 = ?)", 
                [loggedUserEmail, "%" + string + "%", loggedUserEmail, loggedUserEmail],
                (err, rows) => {
                    connection.release();
                    if (err) { callback(err, undefined); return;}
                    else {
                        let friends = [];
                        rows.forEach(friend => {
                            friends.push({ name: friend.name, email: friend.email, picture: friend.profile_picture});
                        });
                        callback(null, friends);
                    }
                })
            }
        });
    }
        
    /**        
     * Inserta en la base de datos una petición de amistad entre dos usuarios de Facebluff.
     * @param {String} user1 email del usuario que envía la petición de amistad
     * @param {String} user2 email del usuario que recibe la petición
     * @param {Function} callback Función que devolverá el objeto error o el resultado
     */
    sendFriendRequest(user1, user2, callback) {
        this.pool.getConnection((err, connection) => {
            if (err) {callback(`Error de conexión: ${err.message}`, undefined); return; } 
            else {
                let pending = 0;
                connection.query("INSERT INTO friends VALUES (?, ?, ?)",
                [user1, user2, pending],
                    (err, rows) => {
                        connection.release();
                        if (err) { callback(err, undefined); return;}
                        else {
                            callback(null, true);
                        }
                    }
                )
            }
        });
    }

    /**
     * Función que actualiza en la base de datos la resolución para una petición de amistad.
     * @param {String} user1 email del usuario que envió la petición de amistad
     * @param {String} user2 email del usuario que recibió la petición
     * @param {bool} response booleano que indica si el usuario que recibió la petición la ha aceptado o la ha rechazado
     * @param {Function} callback Función que devolverá el objeto error o el resultado
     */
    friendRequestResponse(user1, user2, response, callback) {        
        this.pool.getConnection((err, connection) => {
            if (err) { 
                callback(`Error de conexión: ${err.message}`, undefined);
            } 
            else {
                if (response) {
                    connection.query("UPDATE friends SET status = 1 WHERE user1 = ? AND user2 = ?",
                    [user1, user2],
                        (err, rows) => {
                            connection.release();
                            if (err) {
                                 callback(err, undefined); 
                                }
                             else {
                                callback(null, true);
                            }
                        }
                    )
                } else {
                    connection.query("DELETE FROM friends WHERE user1 = ? AND user2 = ?",
                    [user1, user2],
                        (err, rows) => {
                            connection.release();
                            if (err) { 
                                callback(err, undefined);
                            }
                            else {
                               callback(null, true);
                           }
                        }
                    )
                }
            }
        });
    }

    /**
     * Calcula la edad de un usuario en función de su fecha de nacimiento
     * @param {Date} date Fecha de nacimiento del usuario
     * @param {function} callback  Función que devolverá el objeto error o el resultado
     */
    calculateAge (date, callback) {
        var year = new Date(date.toString());
        let age;
        var diff_ms = Date.now() -  year.getTime();
        var age_dt = new Date(diff_ms); 
        age = Math.abs(age_dt.getUTCFullYear() - 1970);
        callback (age);
    }
}

module.exports = {
    daoUsers: daoUsers
}