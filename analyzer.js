const acorn = require("acorn");

function analyzeCode(code) {
  const ast = acorn.parse(code, { ecmaVersion: 2020 });

  let explanation = "";
  let steps = [];
  let stateTable = [];
  let stepNumber = 1;

  let globalScope = {};
  let currentScope = globalScope;

  // -----------------------------
  // Record Execution Step
  // -----------------------------
  function record(message) {
    explanation += `Step ${stepNumber}: ${message}\n`;

    steps.push({
      step: stepNumber,
      message
    });

    // Deep clone scope safely
    stateTable.push({
      step: stepNumber,
      variables: JSON.parse(JSON.stringify(globalScope))
    });

    stepNumber++;
  }

  // -----------------------------
  // Scope Handling
  // -----------------------------
  function createScope(parent) {
    return Object.create(parent);
  }

  function getVariable(name) {
    return currentScope[name];
  }

  function setVariable(name, value) {
    currentScope[name] = value;
  }

  // -----------------------------
  // Expression Evaluation
  // -----------------------------
  function evaluate(node) {
    if (!node) return undefined;

    switch (node.type) {
      case "Literal":
        return node.value;

      case "Identifier":
        return getVariable(node.name);

      case "BinaryExpression": {
        const left = evaluate(node.left);
        const right = evaluate(node.right);

        switch (node.operator) {
          case "+": return left + right;
          case "-": return left - right;
          case "*": return left * right;
          case "/": return left / right;
          case "%": return left % right;
          case "===": return left === right;
          case "==": return left == right;
          case "<": return left < right;
          case ">": return left > right;
          case "<=": return left <= right;
          case ">=": return left >= right;
        }
      }

      case "AssignmentExpression": {
        const value = evaluate(node.right);
        setVariable(node.left.name, value);
        record(`${node.left.name} = ${value}`);
        return value;
      }

      case "UpdateExpression": {
        const name = node.argument.name;
        if (node.operator === "++") {
          setVariable(name, getVariable(name) + 1);
        } else {
          setVariable(name, getVariable(name) - 1);
        }
        record(`${name} updated to ${getVariable(name)}`);
        return getVariable(name);
      }

      case "CallExpression": {
        const func = getVariable(node.callee.name);
        const args = node.arguments.map(arg => evaluate(arg));

        if (func && func.type === "FunctionDeclaration") {
          const previousScope = currentScope;
          currentScope = createScope(previousScope);

          func.params.forEach((param, index) => {
            setVariable(param.name, args[index]);
          });

          let returnValue;
          for (let stmt of func.body.body) {
            if (stmt.type === "ReturnStatement") {
              returnValue = evaluate(stmt.argument);
              break;
            } else {
              execute(stmt);
            }
          }

          currentScope = previousScope;
          record(`Function ${func.id.name} returned ${returnValue}`);
          return returnValue;
        }

        return undefined;
      }

      case "MemberExpression": {
        const object = evaluate(node.object);
        const property = node.property.name;
        return object[property];
      }

      case "ObjectExpression": {
        let obj = {};
        node.properties.forEach(prop => {
          obj[prop.key.name] = evaluate(prop.value);
        });
        return obj;
      }

      case "NewExpression": {
        const classNode = getVariable(node.callee.name);
        let instance = {};

        const constructor = classNode.body.body.find(
          m => m.kind === "constructor"
        );

        if (constructor) {
          const previousScope = currentScope;
          currentScope = createScope(previousScope);

          setVariable("this", instance);

          constructor.value.params.forEach((param, index) => {
            setVariable(param.name, evaluate(node.arguments[index]));
          });

          constructor.value.body.body.forEach(stmt => execute(stmt));

          currentScope = previousScope;
        }

        record(`Instance of ${node.callee.name} created`);
        return instance;
      }
    }
  }

  // -----------------------------
  // Statement Execution
  // -----------------------------
  function execute(node) {
    switch (node.type) {
      case "VariableDeclaration":
        node.declarations.forEach(decl => {
          const value = evaluate(decl.init);
          setVariable(decl.id.name, value);
          record(`${decl.id.name} initialized to ${value}`);
        });
        break;

      case "ExpressionStatement":
        evaluate(node.expression);
        break;

      case "IfStatement":
        const condition = evaluate(node.test);
        record(`Condition evaluated to ${condition}`);
        if (condition) execute(node.consequent);
        else if (node.alternate) execute(node.alternate);
        break;

      case "BlockStatement":
        node.body.forEach(stmt => execute(stmt));
        break;

      case "ForStatement":
        execute(node.init);
        while (evaluate(node.test)) {
          record("For condition true");
          execute(node.body);
          evaluate(node.update);
        }
        record("For loop exited");
        break;

      case "WhileStatement":
        while (evaluate(node.test)) {
          record("While condition true");
          execute(node.body);
        }
        record("While loop exited");
        break;

      case "FunctionDeclaration":
        setVariable(node.id.name, node);
        record(`Function ${node.id.name} defined`);
        break;

      case "ClassDeclaration":
        setVariable(node.id.name, node);
        record(`Class ${node.id.name} defined`);
        break;
    }
  }

  ast.body.forEach(node => execute(node));

  return { explanation, steps, stateTable };
}

module.exports = analyzeCode;