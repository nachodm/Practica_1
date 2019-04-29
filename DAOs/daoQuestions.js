"use strict"

class daoQuestions{

    /**
     * 
     * @param {*} pool 
     */
    constructor(pool){
        this.pool = pool;
    }
    /**
     * Función que inserta una pregunta en la BBDD
     * @param {object} question Objeto que contiene las preguntas y las opciones 
     * @param {function} callback Función que recibirá el objeto error o el resultado
     */
    newQuestion(question, callback){
        this.pool.getConnection((err, connection)=>{
            if (err) {
                callback("Error de conexión a la BBDD", false);
            }
            connection.query("INSERT INTO questions (question_text, numbanswers) VALUES (?, ?)",
            [question.question_text, question.numbanswers],
            (err) => {
                connection.release();
                if (err) {
                    callback("Error de acceso a la BBDD", false);
                }
                else {
                    callback(null, true)
                }
            });
        });
    }

    /**
     * Obtiene el identificador de la última pregunta añadida a la base de datos en función del actual valor de AUTO_INCREMENT
     * @param {function} callback FUnción que recibirá el objeto error o el resultado.
     */
    getLastQid(callback) {
        this.pool.getConnection((err, connection)=>{
            if (err) {
                callback("Error de conexión a la BBDD", false);
            }
            connection.query("SELECT `AUTO_INCREMENT` FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?",
            ["aw", "questions"],
            (err, rows) => {
                connection.release();
                if (err) {
                    callback("Error de acceso a la BBDD", false);
                }
                else {
                    if (rows.length > 0) {
                        callback(null, rows[0].AUTO_INCREMENT);
                    }
                    else callback(null, 2);
                }
            });
        });
    }
    
    /**
     * Inserta cada respuesta a cada pregunta en la tabla s
     * @param {int} Qid Id de la pregunta
     * @param {int} Aid Id de la respuesta
     * @param {String} text Texto de la respuesta
     * @param {*function} callback Función que devolverá un error si la inserción no se hace adecuadamente.
     */
    insertAnswer(Qid, Aid, text, callback){
        this.pool.getConnection((err, connection) =>{
            if (err) {
                callback("Error de conexion a la BBDD");
            }
            connection.query("INSERT INTO s (Qid, Aid, text) VALUES (?, ?, ?)",
            [Qid, Aid, text],
            (err) => {
                connection.release();
                if (err) {
                    callback("Error de acceso a la BBDD");
                }
                else {
                    callback(null);
                }
            });
        });
    }
   
    /**
     * Función que devuelve un objeto con 5 preguntas seleccionadas aleatoriamente de la BBDD
     * @param {function} callback Función que recibirá el objeto error o el resultado
     */
    randomQuestion(callback){
        this.pool.getConnection((err,connection) =>{
            if(err){
                callback("Error de conexión a la BBDD", undefined);  
            }
            connection.query("SELECT id, question_text FROM questions ORDER BY rand() LIMIT 5",
            (err, rows)=>{
                connection.release();
                if(err){
                    callback("Error de acceso a la BBDD", undefined);
                }
                else {
                    let questions = [];
                    if (rows.length > 4){
                        rows.forEach( p => {
                            questions.push({text:p.question_text, id:p.id});
                        });
                    }
                    callback(null, questions);
                }
            });
        });
    }

    /**
     * Función que recoge toda la informacion de la pregunta
     * @param {int} id id de la pregunta
     * @param {function} callback Función que recibirá el objeto error o el resultado
     */
    getQuestionData(id, callback){
        this.pool.getConnection((err, connection)=>{
            if (err) {
                callback("Error de conexion a la BBDD", undefined);
            }
            connection.query("SELECT id, question_text, Aid, text FROM questions JOIN answers ON id=Qid WHERE id = ?",
            [id], (err, rows)=>{
                if (err) {
                    callback("Error de acceso a la BBDD", undefined);
                }
                if (rows.length > 0) {
                    let data = {
                        id: rows[0].id,
                        question_text: rows[0].question_text,
                        answers: []
                    }
                    rows.forEach(row => {
                        data.answers.push({ id: row.Aid, text: row.text });
                    });
                    callback(null, data);
                }
            })
        });
    }
    
    /**
     * Función que comprueba si el usuario ha respondido esa respuesta
     * @param {int} id id de la pregunta
     * @param {string} email email del usuario
     * @param {function} callback Función que recibirá el objeto error o el resultado
     */
    isAnswered(id, email, callback){
        this.pool.getConnection((err, connection) => {
            if (err) {
                callback("Error de conexion a la BBDD", undefined);
            }
            connection.query("SELECT text FROM ownanswers WHERE Qid = ? and email = ?", [id, email],
            (err, rows)=>{
                connection.release();
                if (err) {
                    callback("Error de acceso a la BBDD", undefined);
                }
                if (rows.length > 0) {
                    callback(null, true);
                }
                else callback (null, false);
            });
        });
    }

    /**
     * 
     * @param {*} Qid 
     * @param {*} email 
     * @param {*} friends 
     * @param {*} callback 
     */
    checkFriendAnswer(Qid, email, friend, callback){
        this.pool.getConnection((err, connection) => {
            if (err) {
                callback("Error de conexion a la BBDD", undefined);
            }
            let answer;
            connection.query("SELECT text FROM ownanswers WHERE Qid = ? AND email = ?", 
            [Qid, friend.email],
            (err, rows) => {
                if (err) {
                    callback("Error de acceso a la BBDD", undefined);
                }
                else {
                    if (rows.length > 0) {
                        connection.query("SELECT result FROM users_guesses WHERE email = ? AND friendEmail = ? AND Qid = ?", 
                        [email, friend.email, Qid],
                        (err, rows) => {
                            connection.release();
                            if (err) {
                                callback("Error de acceso a la BBDD", undefined);
                            }
                            else {
                                let guessed = null;
                                if (rows.length > 0) {
                                    guessed = rows[0].result;
                                }
                                answer = {
                                    name: friend.name, 
                                    email: friend.email, 
                                    guessed: guessed 
                                }
                                callback(null, answer);
                             }
                        });
                    }
                }
            });
        });
    }

    /**
     * Inserta la respuesta de un usuario a una pregunta en la base de datos.
     * @param {object} Obj 
     * @param {function} callback 
     */
    answerQuestion(Obj, callback){
       this.pool.getConnection((err, connection)=>{
           if (err) {
               callback("Error de conexión con la BBDD", false);
           }
           connection.query("INSERT INTO ownanswers (email, Qid, text) VALUES (?, ?, ?)", 
           [Obj.email, Obj.Qid, Obj.text],
           (err) => {
               connection.release();
                if (err) {
                    callback("Error de acceso a la BBDD", false);
                }
                else {
                    callback(null, true);
                }
           });
       })
   }
}
 
module.exports = {
    daoQuestions: daoQuestions
}