const mysql = require('mysql');
const inquirer = require('inquirer');
require('console.table');

var questions = [
  {
    type: 'list',
    message: 'What you would like to do?',
    name: 'action',
    choices: [
        'View all employees',
        'View all employees by department',
        'View all employees by manager',
        'Add employee',
        'Remove employee',
        'Update employee role',
        'Update employee manager',
        'View all roles',
        'Add role',
        'Remove role',
        'exit',
    ]
  }
];

const connection = mysql.createConnection({
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: 'deenanath',
  database: 'employeeTrackerDb',
});

connection.connect((erroror) => {
  if (erroror) throw erroror;
  console.log('Connected DB successfully');
  init();
});

function init() {
  inquirer.prompt(questions)
    .then((answers) => {
      switch (answers.action) {
        case 'View all employees':
          getEmployees();
          break;
        case 'View all employees by department':
          getEmoyeesByDept();
          break;
        case 'View all employees by manager':
          getEmoyeesByManager();
          break;
        case 'Add employee':
          addEmployee();
          break;
        case 'Remove employee':
          deleteEmployee();
          break;
        case 'Update employee role':
          updateEmployeeRole();
          break;
        case 'Update employee manager':
          updateEmployeeManager();
          break;
        case 'View all roles':
          getEmployeeRoles();
          break;
        case 'Add role':
          addRole();
          break;
        case 'Remove role':
          deleteRole();
          break;
        case 'exit':
          exit();
          break;
        default:
          exit();
      }
    });
}

function exit() {
  connection.end();
}

// get employees
function getEmployees() {
  // build query
  const getEmployeesQry = `SELECT employee.id, 
                    employee.first_name, 
                    employee.last_name,
                    role.title as role, 
                    department.name as department, 
                    role.salary, 
                    concat(m.first_name, ' ',m.last_name) as manager 
                  FROM employee 
                  INNER JOIN role ON (employee.role_id = role.id) 
                  INNER JOIN department ON(department.id = role.department_id)
                  LEFT JOIN employee m on(employee.id = m.manager_id)`;
    
  // Execute query
  connection.query(getEmployeesQry, (error, res) => {
    if (error) throw error;
    console.table(res);
    init();
  });
}


// get employees by department
function getEmoyeesByDept() {
  // build query
  const getEmployeesByDeptQry = `SELECT department.id, department.name
                  FROM employee 
                  INNER JOIN role ON (employee.role_id = role.id) 
                  INNER JOIN department ON (department.id = role.department_id) 
                  GROUP BY department.id, department.name;`;
  
  // execute query
  connection.query(getEmployeesByDeptQry, (error, res) => {
    if (error) throw error;
    const listDept = res.map((data) => ({
      value: data.id, name: data.name,
    }));

    promptDepartment(listDept);
  });
}

// Prompt department
function promptDepartment(listDept) {
  inquirer
    .prompt({
      name: 'department_id',
      type: 'list',
      message: 'Which department employees would you like to see?',
      choices: listDept,
    })
    .then((answer) => {
      // build query
      const query = `SELECT concat(employee.first_name,' ',employee.last_name) as Employee, 
                      department.name as Department
                    FROM employee INNER JOIN role ON (employee.role_id = role.id) 
                    INNER JOIN department ON (department.id = role.department_id) 
                    WHERE department.id=?`;

      // execute query
      connection.query(query, [answer.department_id], (error, res) => {
        if (error) throw error;
        console.table(res);
        init();
      });
    });
}

// get employees by manager
function getEmoyeesByManager() {
  // build qry
  const getEmpsByMgrQry = 'SELECT employee.id, employee.first_name, employee.last_name FROM employee;';

  // execute query
  connection.query(getEmpsByMgrQry, (error, res) => {
    if (error) throw error;
    const managersList = res.map((data) => ({
      value: data.id, name: `${data.first_name} ${data.last_name}`,
    }));

    promptManager(managersList);
  });
}

function promptManager(managersList) {
  inquirer
    .prompt({
      name: 'id',
      type: 'list',
      message: 'Which employees manager would you like to see?',
      choices: managersList,
    })
    .then((answer) => {
      // build query
      const getMgrListQry = `SELECT concat(employee.first_name,' ',employee.last_name) as Employee, 
                      concat(m.first_name,' ',m.last_name) as Manager
                    FROM employee 
                    LEFT JOIN employee m on (employee.id = m.manager_id) 
                    WHERE employee.id=?`;
      
      // execute query
      connection.query(getMgrListQry, [answer.id], (error, res) => {
        if (error) throw error;
        console.table(res);
        init();
      });
    });
}

// add employee
function addEmployee() {
  // build query
  const getRoleQry = 'SELECT role.id, role.title FROM role;';

  // execute query
  connection.query(getRoleQry, (error, res) => {
    if (error) throw error;
    const rolesList = res.map((data) => ({
      value: data.id, name: data.title,
    }));

    // build query
    const getEmpQry = 'SELECT employee.id, employee.first_name,employee.last_name FROM employee;';

    // execute query
    connection.query(getEmpQry, (err, re) => {
      if (err) throw err;
      const managersList = re.map((data) => ({
        value: data.id, name: `${data.first_name} ${data.last_name}`,
      }));

      getEmpInputs(rolesList, managersList);
    });
  });
}

function getEmpInputs(rolesList, managersList) {
  inquirer
    .prompt([
      {
        name: 'first_name',
        type: 'input',
        message: 'What is the employees first name?',
      },
      {
        name: 'last_name',
        type: 'input',
        message: 'What is the employees last name?',
      },
      {
        name: 'employee_role',
        type: 'list',
        message: 'What is the employees role?',
        choices: rolesList,
      },
      {
        name: 'employee_manager',
        type: 'list',
        message: 'Who is he/she a manager to?',
        choices: managersList,
      },
    ])
    .then((answer) => {
      const addEmpQry = 'INSERT INTO employee (first_name,last_name,role_id,manager_id) VALUES(?,?,?,?);';
      connection.query(addEmpQry,
        [answer.first_name, answer.last_name, answer.employee_role, answer.employee_manager],
        (error, res) => {
          if (error) throw error;
          console.table(res);
          init();
        });
    });
}


// Delete employee
function deleteEmployee() {
  // build qry
  const delEmpQry = 'SELECT employee.id, employee.first_name,employee.last_name FROM employee;';
  // execute qry
  connection.query(delEmpQry, (error, res) => {
    if (error) throw error;
    const listEmployees = res.map((data) => ({
      value: data.id, name: `${data.first_name} ${data.last_name}`,
    }));
    promptEmployee(listEmployees);
  });
}

// list emmployees
function promptEmployee(listEmployees) {
  inquirer
    .prompt([
      {
        name: 'employee_id',
        type: 'list',
        message: 'Which employee you would like to remove?',
        choices: listEmployees,
      },
    ])
    .then((answer) => {
      const delEmpQry = 'DELETE FROM employee where employee.id=?;';
      connection.query(delEmpQry, [answer.employee_id], (error, res) => {
        if (error) throw error;
        console.table(res);
        init();
      });
    });
}

// Update employee role
function updateEmployeeRole() {
  // build query
  const updEmpRoleQry = 'SELECT employee.id, employee.first_name,employee.last_name FROM employee;';
  // execute query
  connection.query(updEmpRoleQry, (error, res) => {
    if (error) throw error;
    const listEmployees = res.map((data) => ({
      value: data.id, name: `${data.first_name} ${data.last_name}`,
    }));

    getEmp(listEmployees);
  });
}

// get employee from input
function getEmp(listEmployees) {
  inquirer
    .prompt(
      {
        name: 'employee_id',
        type: 'list',
        message: 'Which employees role you would like to update?',
        choices: listEmployees,
      },
    )
    .then((answer) => {
      getRole(answer.employee_id);
    });
}

// get role from input
function getRole(employeeId) {
  // build query
  const getRoleQry = 'SELECT role.id, role.title FROM role;';
  // execute query
  connection.query(getRoleQry, (error, res) => {
    if (error) throw error;
    const rolesList = res.map((data) => ({
      value: data.id, name: data.title,
    }));

    promptRoleUpdate(rolesList, employeeId);
  });
}

function promptRoleUpdate(rolesList, employeeId) {
  inquirer
    .prompt(
      {
        name: 'role_id',
        type: 'list',
        message: 'What is the role you would like to update to?',
        choices: rolesList,
      },
    )
    .then((answer) => {
      // build qry
      const updEmpQry = 'UPDATE employee SET employee.role_id=? WHERE employee.id=?';
      // execute qry
      connection.query(updEmpQry, [answer.role_id, employeeId], (error, res) => {
        if (error) throw error;
        console.table(res);
        init();
      });
    });
}

// Update employee manager
function updateEmployeeManager() {
  // build qry
  const getEmpQry = 'SELECT employee.id, employee.first_name, employee.last_name FROM employee;';
  // execute qry
  connection.query(getEmpQry, (error, res) => {
    if (error) throw error;
    const listEmployees = res.map((data) => ({
      value: data.id, name: `${data.first_name} ${data.last_name}`,
    }));
    inquirer
      .prompt(
        {
          name: 'employee_id',
          type: 'list',
          message: 'Manager name?',
          choices: listEmployees,
        })
      .then((answer) => {
        sendManager(listEmployees, answer.employee_id);
      });
  });
}

function sendManager(listEmployees, employeeId) {
  inquirer
    .prompt(
      {
        name: 'manager_id',
        type: 'list',
        message: 'Employee name?',
        choices: listEmployees,
      },
    )
    .then((answer) => {
      // build qry
      const updEmpMgrQry = 'UPDATE employee SET employee.manager_id=? WHERE employee.id=?';
      // execute qry
      connection.query(updEmpMgrQry, [answer.manager_id, employeeId], (error1, res1) => {
        if (error1) throw error1;
        console.table(res1);
        init();
      });
    });
}

// get employee roles
function getEmployeeRoles() {
  // build qry
  const getRoleQry2 = `SELECT role.id,
                    role.title as Role,
                    role.salary,
                    department.name as department 
                  FROM role 
                  LEFT JOIN department on (role.department_id=department.id)`;
  // execute qry
  connection.query(getRoleQry2, (error, res) => {
    if (error) throw error;
    console.table(res);
    init();
  });
}

// add role
function addRole() {
  // build query
  const query = `SELECT department.id, department.name
                FROM employee 
                INNER JOIN role ON (employee.role_id = role.id) 
                INNER JOIN department ON (department.id = role.department_id) 
                GROUP BY department.id, department.name;`;

  // execute query
  connection.query(query, (error, res) => {
    if (error) throw error;
    const listDept = res.map((data) => ({
      value: data.id, name: data.name,
    }));
    promptDept(listDept);
  });
}

function promptDept(listDept) {
  inquirer
    .prompt([
      {
        name: 'role_title',
        type: 'input',
        message: 'Which role would you like to add?',
      },
      {
        name: 'role_salary',
        type: 'input',
        message: 'Enter the salary for the role?',
      },
      {
        name: 'role_department_id',
        type: 'list',
        message: 'Which department the role is under?',
        choices: listDept,
      },

    ])
    .then((answer) => {
      // build query
      const addRoleQry = 'INSERT into role (title, salary, department_id) values(?,?,?);';
      // execute query
      connection.query(addRoleQry, [answer.role_title, answer.role_salary, answer.role_department_id],
        (error, res) => {
          if (error) throw error;
          console.table(res);
          init();
        });
    });
}

// remove role
function deleteRole() {
  // build query
  const query = 'SELECT role.id, role.title FROM role;';
  // execute query
  connection.query(query, (error, res) => {
    if (error) throw error;
    const rolesList = res.map((data) => ({
      value: data.id, name: data.title,
    }));

    promptRole(rolesList);
  });
}

function promptRole(rolesList) {
  inquirer
    .prompt([
      {
        name: 'id',
        type: 'list',
        message: 'Which role would you like to remove?',
        choices: rolesList,
      },
    ])
    .then((answer) => {
      // build query
      const delRoleQry = 'DELETE from role where role.id=?;';
      // execute query
      connection.query(delRoleQry, [answer.id], (error, res) => {
        if (error) throw error;
        console.table(res);
        init();
      });
    });
}