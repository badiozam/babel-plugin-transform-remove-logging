"use strict";

module.exports = function ({
  types: t
}) {
  return {
    name: "transform-remove-logging",
    visitor: {
      CallExpression(path, state) {
        const callee = path.get("callee");

        if (isLoggingStatement(callee)) {
            path.remove();
        } 
      },

    }
  };

  function isLoggingStatement(id) {
    return id.isIdentifier({ name: "error" }) || id.isIdentifier({ name: "warn" }) || id.isIdentifier({ name: "info" }) || id.isIdentifier({ name: "debug" }) || id.isIdentifier({ name: "trace" });
  }

  function createNoop() {
    return t.functionExpression(null, [], t.blockStatement([]));
  }

  function createVoid0() {
    return t.unaryExpression("void", t.numericLiteral(0));
  }
};
