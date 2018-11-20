CREATE TABLE `users` (
    `email` varchar(256) NOT NULL,
    `password` varchar (20) NOT NULL,
    `name` varchar(256) NOT NULL,
    `gender` char(1) NOT NULL,
    `birthdate` date DEFAULT NULL,
    `profile_picture` varchar(256) DEFAULT NULL,
    `points` int(5) DEFAULT 0,
    PRIMARY KEY (`email`)
);

CREATE TABLE `friends` (
    `user1` varchar(256) NOT NULL,
    `user2` varchar(256) NOT NULL,
    `status` tinyint(3) UNSIGNED DEFAULT NULL,
    PRIMARY KEY (`user1`, `user2`),
    CONSTRAINT `fk_user1`FOREIGN KEY (`user1`) REFERENCES `users`(`email`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_user2`FOREIGN KEY (`user2`) REFERENCES `users`(`email`) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE `questions` (
    `id` int(20) AUTO_INCREMENT,
    `question_text` varchar (256) NOT NULL,
    `option_1` varchar (256) NOT NULL,
    `option_2` varchar (256) NOT NULL,
    `option_3` varchar (256) NOT NULL,
    `other` varchar (256),
    PRIMARY KEY (`id`)
);

CREATE TABLE `answers`(
    `Qid` int(20) NOT NULL,
    `Aid` int(20) AUTO_INCREMENT,
    `text` varchar (256) NOT NULL,
    PRIMARY KEY (`Aid`),
    FOREIGN KEY (`Qid`) REFERENCES `questions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
);