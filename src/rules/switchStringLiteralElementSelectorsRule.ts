import {Replacement, RuleFailure, Rules, RuleWalker} from 'tslint';
import * as ts from 'typescript';
import {elementSelectors} from '../material/component-data';
import {findAll} from '../typescript/literal';

/** Message that is being sent to TSLint if a string literal still uses the outdated name. */
const failureMessage = 'Deprecated string literal value can be updated.';

/**
 * Rule that walks through every string literal, which includes the outdated Material name and
 * is part of a call expression. Those string literals will be changed to the new name.
 */
export class Rule extends Rules.AbstractRule {
  apply(sourceFile: ts.SourceFile): RuleFailure[] {
    return this.applyWithWalker(
        new SwitchStringLiteralElementSelectorsWalker(sourceFile, this.getOptions()));
  }
}

export class SwitchStringLiteralElementSelectorsWalker extends RuleWalker {
  visitStringLiteral(stringLiteral: ts.StringLiteral) {
    if (stringLiteral.parent.kind !== ts.SyntaxKind.CallExpression) {
      return;
    }

    let stringLiteralText = stringLiteral.getFullText();

    elementSelectors.forEach(selector => {
      this.createReplacementsForOffsets(stringLiteral, selector,
          findAll(stringLiteralText, selector.replace)).forEach(replacement => {
        this.addFailureAtNode(stringLiteral, failureMessage, replacement);
      });
    });
  }

  private createReplacementsForOffsets(node: ts.Node,
                                       update: {replace: string, replaceWith: string},
                                       offsets: number[]): Replacement[] {
    return offsets.map(offset => this.createReplacement(
        node.getStart() + offset, update.replace.length, update.replaceWith));
  }
}