import { PluginKind, declareValuePlugin } from '@stryker-mutator/api/plugin';

export const strykerPlugins = [declareValuePlugin(PluginKind.Ignore, 'console', {
  shouldIgnore(path) {
    // Define the conditions for which you want to ignore mutants
    if (
      path.isExpressionStatement() &&
      path.node.expression.type === 'CallExpression' &&
      path.node.expression.callee.type === 'MemberExpression' &&
      path.node.expression.callee.object.type === 'Identifier' &&
      path.node.expression.callee.object.name === 'console'
    ) {
      return "We're not interested in testing `console` statements.";
    }
  }
})];