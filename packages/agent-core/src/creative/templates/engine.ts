import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { logger } from '../../logger';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const templateCache = new Map<string, string>();

/**
 * Locate the root templates directory across development, tests, and CLI execution.
 */
export function getTemplatesDirectory(): string {
  const candidates = [
    path.resolve(__dirname, '../../../templates'),
    path.resolve(__dirname, '../../templates'),
    path.resolve(__dirname, '../templates'),
    path.resolve(process.cwd(), 'packages/agent-core/templates'),
    path.resolve(process.cwd(), 'templates'),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) {
      return candidate;
    }
  }

  // Fallback to standard package templates path
  return path.resolve(__dirname, '../../../templates');
}

/**
 * Evaluate a dotted path expression against a context object.
 * e.g. "productSpec.productType" -> context.productSpec?.productType
 */
function resolvePath(expr: string, context: Record<string, any>): any {
  const trimmed = expr.trim();
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  if (trimmed === 'null' || trimmed === 'none') return null;
  if (trimmed.startsWith("'") && trimmed.endsWith("'")) return trimmed.slice(1, -1);
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) return trimmed.slice(1, -1);
  if (!isNaN(Number(trimmed)) && trimmed !== '') return Number(trimmed);

  // Handle pipe default filter: "val | default('fallback')"
  if (trimmed.includes('|')) {
    const [leftExpr, filterCall] = trimmed.split('|').map((s) => s.trim());
    const val = resolvePath(leftExpr!, context);
    if (val !== undefined && val !== null && val !== '') {
      return val;
    }
    if (filterCall && filterCall.startsWith('default(') && filterCall.endsWith(')')) {
      const fallback = filterCall.slice(8, -1).trim();
      return resolvePath(fallback, context);
    }
    return val;
  }

  const parts = trimmed.split('.');
  let current: any = context;
  for (const part of parts) {
    if (current === undefined || current === null) return undefined;
    current = current[part];
  }
  return current;
}

/**
 * Evaluate condition expression for {% if ... %}
 */
function evaluateCondition(cond: string, context: Record<string, any>): boolean {
  const trimmed = cond.trim();

  // Equality: a == b
  if (trimmed.includes('==')) {
    const [left, right] = trimmed.split('==').map((s) => s.trim());
    const leftVal = resolvePath(left!, context);
    const rightVal = resolvePath(right!, context);
    return leftVal == rightVal;
  }

  // Inequality: a != b
  if (trimmed.includes('!=')) {
    const [left, right] = trimmed.split('!=').map((s) => s.trim());
    const leftVal = resolvePath(left!, context);
    const rightVal = resolvePath(right!, context);
    return leftVal != rightVal;
  }

  // Negation: not a
  if (trimmed.startsWith('not ')) {
    return !evaluateCondition(trimmed.slice(4).trim(), context);
  }

  const val = resolvePath(trimmed, context);
  if (Array.isArray(val)) return val.length > 0;
  return Boolean(val);
}

/**
 * Render a Jinja template string with full support for:
 * - {{ var }} and {{ var | default('fallback') }}
 * - {% if cond %} ... {% elif cond %} ... {% else %} ... {% endif %}
 * - {% for item in items %} ... {% endfor %}
 */
export function renderString(templateStr: string, context: Record<string, any>): string {
  // 1. Process {% for ... %} blocks recursively
  const forRegex = /{%[-]?\s*for\s+(\w+)\s+in\s+([^%]+?)\s*[-]?%}([\s\S]*?){%[-]?\s*endfor\s*[-]?%}/;
  let str = templateStr;
  let forMatch: RegExpExecArray | null;

  while ((forMatch = forRegex.exec(str)) !== null) {
    const itemVar = forMatch[1]!;
    const listExpr = forMatch[2]!.trim();
    const innerBody = forMatch[3]!;
    const list = resolvePath(listExpr, context);

    let renderedLoop = '';
    if (Array.isArray(list)) {
      for (const item of list) {
        const loopContext = { ...context, [itemVar]: item };
        renderedLoop += renderString(innerBody, loopContext);
      }
    }

    str = str.slice(0, forMatch.index) + renderedLoop + str.slice(forMatch.index + forMatch[0].length);
  }

  // 2. Process {% if ... %} blocks recursively
  const ifRegex = /{%[-]?\s*if\s+([^%]+?)\s*[-]?%}([\s\S]*?)(?:{%[-]?\s*else\s*[-]?%}([\s\S]*?))?{%[-]?\s*endif\s*[-]?%}/;
  let ifMatch: RegExpExecArray | null;

  while ((ifMatch = ifRegex.exec(str)) !== null) {
    const condition = ifMatch[1]!.trim();
    const ifBody = ifMatch[2]!;
    const elseBody = ifMatch[3] || '';

    const branchToRender = evaluateCondition(condition, context) ? ifBody : elseBody;
    const renderedBranch = renderString(branchToRender, context);

    str = str.slice(0, ifMatch.index) + renderedBranch + str.slice(ifMatch.index + ifMatch[0].length);
  }

  // 3. Process {{ ... }} expressions
  const varRegex = /{{[-]?\s*([^}]+?)\s*[-]?}}/g;
  str = str.replace(varRegex, (_, expr) => {
    const val = resolvePath(expr, context);
    if (val === undefined || val === null) {
      return '';
    }
    return String(val);
  });

  return str;
}

/**
 * Load and render a .jinja template file from the templates directory.
 * @param templateRelPath e.g. "prompts/five_part_system.jinja" or "video/egg_coverage_test.jinja"
 * @param context Template variables
 */
export function renderTemplate(templateRelPath: string, context: Record<string, any>): string {
  const normPath = templateRelPath.endsWith('.jinja') ? templateRelPath : `${templateRelPath}.jinja`;
  let templateContent = templateCache.get(normPath);

  if (!templateContent) {
    const fullPath = path.join(getTemplatesDirectory(), normPath);
    if (!fs.existsSync(fullPath)) {
      const err = new Error(`Jinja template not found at: ${fullPath} (searched templates dir: ${getTemplatesDirectory()})`);
      logger.error('Failed to load Jinja template file', err, {
        templateRelPath: normPath,
        resolvedPath: fullPath,
        templatesDirectory: getTemplatesDirectory(),
      });
      throw err;
    }
    templateContent = fs.readFileSync(fullPath, 'utf8');
    templateCache.set(normPath, templateContent);
  }

  return renderString(templateContent, context).trim();
}


/**
 * Clear memory cache of loaded templates (useful for unit tests or hot reload).
 */
export function clearTemplateCache(): void {
  templateCache.clear();
}
