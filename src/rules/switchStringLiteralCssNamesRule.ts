import {Replacement, RuleFailure, Rules, RuleWalker} from 'tslint';
import * as ts from 'typescript';
import {cssNames} from '../material/component-data';
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
        new SwitchStringLiteralCssNamesWalker(sourceFile, this.getOptions()));
  }
}

export class SwitchStringLiteralCssNamesWalker extends RuleWalker {
  visitStringLiteral(stringLiteral: ts.StringLiteral) {
    if (stringLiteral.parent.kind !== ts.SyntaxKind.CallExpression) {
      return;
    }

    let stringLiteralText = stringLiteral.getFullText();

    cssNames.forEach(name => {
      if (!name.whitelist || name.whitelist.strings) {
        this.createReplacementsForOffsets(stringLiteral, name,
            findAll(stringLiteralText, name.replace)).forEach(replacement => {
          this.addFailureAtNode(stringLiteral, failureMessage, replacement)
        });
      }
    });
  }

  private createReplacementsForOffsets(node: ts.Node,
                                       update: {replace: string, replaceWith: string},
                                       offsets: number[]): Replacement[] {
    return offsets.map(offset => this.createReplacement(
        node.getStart() + offset, update.replace.length, update.replaceWith));
  }
}