CREATE TABLE `students` (
    `id` varchar(256) NOT NULL,
    `name` varchar(256) NOT NULL,
    `surnames` varchar(256) NOT NULL,
    `picture` varchar(256) DEFAULT NULL,
    PRIMARY KEY (`id`)
);

CREATE TABLE `hall` (
    `id` varchar(256) NOT NULL,
    `rows` varchar(256) NOT NULL,
    `columns` varchar(256) NOT NULL,
    PRIMARY KEY (`id`)
);

CREATE TABLE `courses` (
    `id` varchar(256) NOT NULL,
    `sample1` varchar(256) NOT NULL,
    `sample2` varchar(256) DEFAULT NULL,
    `sample3` varchar(256) DEFAULT NULL,
    `date` date NOT NULL,
    PRIMARY KEY (`id`)
);

CREATE TABLE `enrolled` (
    `student_id` varchar(256) NOT NULL,
    `courses_id` varchar(256) NOT NULL,
     PRIMARY KEY (`student_id`, `courses_id`),
    CONSTRAINT `enrolled_fk1`FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `enrolled_fk2`FOREIGN KEY (`courses_id`) REFERENCES `courses`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
);