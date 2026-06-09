"use client";

import { Fragment, useMemo } from "react";

interface RichContentProps {
  content: string;
  className?: string;
  size?: "sm" | "base" | "lg";
}

type Block =
  | { type: "p"; lines: string[] }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] };

function parseBlocks(text: string): Block[] {
  const lines = text.split("\n");
  const blocks: Block[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];

    if (line.trim() === "") {
      index += 1;
      continue;
    }

    if (/^- /.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^- /.test(lines[index])) {
        items.push(lines[index].replace(/^- /, ""));
        index += 1;
      }
      blocks.push({ type: "ul", items });
      continue;
    }

    if (/^\d+\. /.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^\d+\. /.test(lines[index])) {
        items.push(lines[index].replace(/^\d+\. /, ""));
        index += 1;
      }
      blocks.push({ type: "ol", items });
      continue;
    }

    const paragraph: string[] = [];
    while (
      index < lines.length &&
      lines[index].trim() !== "" &&
      !/^- /.test(lines[index]) &&
      !/^\d+\. /.test(lines[index])
    ) {
      paragraph.push(lines[index]);
      index += 1;
    }
    blocks.push({ type: "p", lines: paragraph });
  }

  return blocks;
}

function parseInline(text: string, keyPrefix: string): React.ReactNode[] {
  const pattern = /(\*\*[^*]+\*\*|\*[^*]+\*|==[^=]+==|`[^`]+`)/g;
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let partIndex = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];
    const key = `${keyPrefix}-${partIndex}`;

    if (token.startsWith("**")) {
      nodes.push(
        <strong key={key} className="font-semibold text-base-content">
          {token.slice(2, -2)}
        </strong>,
      );
    } else if (token.startsWith("*")) {
      nodes.push(
        <em key={key} className="italic opacity-90">
          {token.slice(1, -1)}
        </em>,
      );
    } else if (token.startsWith("==")) {
      nodes.push(
        <mark key={key} className="rich-highlight">
          {token.slice(2, -2)}
        </mark>,
      );
    } else if (token.startsWith("`")) {
      nodes.push(
        <code key={key} className="rich-code">
          {token.slice(1, -1)}
        </code>,
      );
    }

    lastIndex = match.index + token.length;
    partIndex += 1;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes.length > 0 ? nodes : [text];
}

const sizeClasses = {
  sm: "rich-content rich-content-sm",
  base: "rich-content",
  lg: "rich-content rich-content-lg",
};

export default function RichContent({
  content,
  className = "",
  size = "base",
}: RichContentProps) {
  const blocks = useMemo(() => parseBlocks(content), [content]);

  return (
    <div className={`${sizeClasses[size]} ${className}`.trim()}>
      {blocks.map((block, blockIndex) => {
        if (block.type === "ul") {
          return (
            <ul key={blockIndex} className="rich-list rich-list-disc">
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>{parseInline(item, `ul-${blockIndex}-${itemIndex}`)}</li>
              ))}
            </ul>
          );
        }

        if (block.type === "ol") {
          return (
            <ol key={blockIndex} className="rich-list rich-list-decimal">
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>{parseInline(item, `ol-${blockIndex}-${itemIndex}`)}</li>
              ))}
            </ol>
          );
        }

        return (
          <p key={blockIndex} className="rich-paragraph">
            {block.lines.map((line, lineIndex) => (
              <Fragment key={lineIndex}>
                {lineIndex > 0 && <br />}
                {parseInline(line, `p-${blockIndex}-${lineIndex}`)}
              </Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}
