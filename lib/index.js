"use strict";

module.exports = function ({
  types: t
}) {
  return {
    name: "transform-remove-logging",
    visitor: {
      CallExpression(path, state) {
        const callee = path.get("callee");
        if (!callee.isMemberExpression()) return;

        if (isIncludedConsole(callee, state.opts.exclude)) {
          // console.log()
          if (path.parentPath.isExpressionStatement()) {
            path.remove();
          } else {
            path.replaceWith(createVoid0());
          }
        } else if (isIncludedConsoleBind(callee, state.opts.exclude)) {
          // console.log.bind()
          path.replaceWith(createNoop());
        }
      },

      MemberExpression: {
        exit(path, state) {
          if (isIncludedConsole(path, state.opts.exclude) && !path.parentPath.isMemberExpression()) {
            if (path.parentPath.isAssignmentExpression() && path.parentKey === "left") {
              path.parentPath.get("right").replaceWith(createNoop());
            } else {
              path.replaceWith(createNoop());
            }
          }
        }

      }
    }
  };

  function isLoggingStatement(id, name) {
    return id.isIdentifier({
      name
    }) && !id.scope.getBinding(name) && id.scope.hasGlobal(name);
  }

  function isLoggingStatement(id) {
    return isLoggingStatement(id, "trace") || isLoggingStatement(id, "debug") || isLoggingStatement(id, "info") || isLoggingStatement(id, "warn") || isLoggingStatement(id, "error");
  }

  function isExcluded(property, excludeArray) {
    return excludeArray && excludeArray.some(name => property.isIdentifier({
      name
    }));
  }

  function isIncludedConsole(memberExpr, excludeArray) {
    const object = memberExpr.get("object");
    const property = memberExpr.get("property");
    if (isExcluded(property, excludeArray)) return false;
    if (isLoggingStatement(object)) return true;
    return isLoggingStatement(object.get("object")) && (property.isIdentifier({
      name: "call"
    }) || property.isIdentifier({
      name: "apply"
    }));
  }

  function isIncludedConsoleBind(memberExpr, excludeArray) {
    const object = memberExpr.get("object");
    if (!object.isMemberExpression()) return false;
    if (isExcluded(object.get("property"), excludeArray)) return false;
    return isLoggingStatement(object.get("object")) && memberExpr.get("property").isIdentifier({
      name: "bind"
    });
  }

  function createNoop() {
    return t.functionExpression(null, [], t.blockStatement([]));
  }

  function createVoid0() {
    return t.unaryExpression("void", t.numericLiteral(0));
  }
};