import { Doc, Reference, Footnote, HasChildren, Node } from "./ast.js";

const blockTag : Record<string, boolean> = {
  para: true,
  blockquote: true,
  thematic_break: true,
  list_item: true,
  list: true,
  code_block: true,
  heading: true,
  table: true
}

class HTMLRenderer {
  buffer : string[];
  tight : boolean;
  footnoteIndex : Record<string, any>; // TODO
  nextFootnoteIndex : number; // TODO?
  references: Record<string, Reference>;
  footnotes: Record<string, Footnote>;

  constructor() {
    this.buffer = [];
    this.tight = false;
    this.footnoteIndex = {};
    this.nextFootnoteIndex = 1;
    this.references = {};
    this.footnotes = {};
  }

  escape (s : string) : string {
    return s
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;");
  }

  out (s : string) : void {
    this.buffer.push(this.escape(s));
  }

  literal (s : string) : void {
    this.buffer.push(s);
  }

  renderAttributes (node : any) : void {
    if (node.attributes) {
      for (let k in node.attributes) {
        this.literal(` ${k}="${this.escape(node.attributes[k])}"`);
      }
    }
    if (node.pos) {
      let sp = node.pos.start;
      let ep = node.pos.end;
      this.literal(` data-startpos="${sp.line}:${sp.col}:${sp.offset}" data-endpos="${ep.line}:${ep.col}:${ep.offset}"`);
    }
  }

  renderTag (tag : string, node : any) : void {
    this.literal("<");
    this.literal(tag);
    this.renderAttributes(node);
    this.literal(">");
  }

  renderCloseTag (tag : string) : void {
    this.literal("</");
    this.literal(tag);
    this.literal(">");
  }

  inTags (tag : string, node : any, newlines : number) : void {
    this.renderTag(tag, node);
    if (newlines > 1) { this.literal("\n"); }
    this.renderChildren(node);
    this.renderCloseTag(tag);
    if (newlines === 1) { this.literal("\n"); }
  }

  renderChildren (node : HasChildren) : void {
    node.children.forEach(child => {
      this.renderNode(child);
    });
  }

  renderNode (node : Node) : void {
    switch(node.tag) {
      case "para":
        this.inTags("p", node, 1);
        break;

      case "blockquote":
        this.inTags("blockquote", node, 2);
        break;

      case "div":
        this.inTags("div", node, 2);
        break;

      case "heading":
        this.inTags(`h${node.level}`, node, 1);
        break;

      case "thematic_break":
        this.renderTag("hr", node);
        this.literal("\n");
        break;

      case "code_block":
        this.renderTag("pre", node);
        this.literal("<code");
        if (node.lang) {
          this.literal(` class="language-${this.escape(node.lang)}"`);
        }
        this.literal(">");
        this.out(node.text);
        this.renderCloseTag("code");
        this.renderCloseTag("pre");
        this.literal("\n");
        break;

      case "str":
        this.out(node.text);
        break;

      case "softbreak":
        this.literal("\n");
        break;

      case "hardbreak":
        this.literal("<br>\n");
        break;

      case "nbsp":
        this.literal("&nbsp;");
        break;

      case "strong":
        this.inTags("strong", node, 0);
        break;

      case "emph":
        this.inTags("em", node, 0);
        break;

      case "mark":
        this.inTags("mark", node, 0);
        break;

      case "insert":
        this.inTags("ins", node, 0);
        break;

      case "delete":
        this.inTags("del", node, 0);
        break;

      case "superscript":
        this.inTags("sup", node, 0);
        break;

      case "subscript":
        this.inTags("sub", node, 0);
        break;

      default:
    }
  }

  render (doc : Doc) : string {
    this.renderChildren(doc);
    return this.buffer.join("");
  }
}

const renderHTML = function(ast : Doc) : string {
  let renderer = new HTMLRenderer();
  return renderer.render(ast);
}

export { renderHTML }
