DROP DATABASE IF EXISTS employeeTrackerDb;
CREATE DATABASE employeeTrackerDb;
use employeeTrackerDb;

CREATE TABLE department (
  id int NOT NULL AUTO_INCREMENT,
  name varchar(30) DEFAULT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE role (
  id int NOT NULL AUTO_INCREMENT,
  title varchar(30) DEFAULT NULL,
  salary decimal(10,0) DEFAULT NULL,
  department_id int DEFAULT NULL,
  PRIMARY KEY (id),
  KEY fk_department_idx (department_id),
  CONSTRAINT fk_department FOREIGN KEY (department_id) REFERENCES department (id)
);

CREATE TABLE employee (
  id int NOT NULL AUTO_INCREMENT,
  first_name varchar(30) DEFAULT NULL,
  last_name varchar(30) DEFAULT NULL,
  role_id int DEFAULT NULL,
  manager_id int DEFAULT NULL,
  PRIMARY KEY (id),
  KEY fk_manager_idx (manager_id),
  KEY fk_role_idx (role_id),
  CONSTRAINT fk_role FOREIGN KEY (role_id) REFERENCES role (id)
);