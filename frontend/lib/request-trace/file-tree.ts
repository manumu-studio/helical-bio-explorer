// Builds a visual file tree from checkpoint file paths.

import type { Checkpoint } from "./checkpoints";

export interface TreeNode {
  readonly name: string;
  readonly isFile: boolean;
  readonly step: number | null;
  readonly isCurrent: boolean;
  readonly children: TreeNode[];
}

function ensurePath(root: TreeNode[], segments: readonly string[], step: number, isCurrent: boolean): void {
  let current = root;

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    if (segment === undefined) continue;
    const isLast = i === segments.length - 1;

    let existing = current.find((n) => n.name === segment);
    if (existing === undefined) {
      const node: TreeNode = {
        name: segment,
        isFile: isLast,
        step: isLast ? step : null,
        isCurrent: isLast && isCurrent,
        children: [],
      };
      current.push(node);
      existing = node;
    } else if (isLast) {
      const updated: TreeNode = {
        ...existing,
        step,
        isCurrent: isCurrent || existing.isCurrent,
      };
      const idx = current.indexOf(existing);
      current[idx] = updated;
      existing = updated;
    }

    current = existing.children;
  }
}

export function buildFileTree(checkpoints: readonly Checkpoint[], currentStep: number): TreeNode[] {
  const root: TreeNode[] = [];

  for (let i = 0; i <= currentStep; i++) {
    const cp = checkpoints[i];
    if (cp === undefined || cp.file === null) continue;

    const segments = cp.file.split("/");
    ensurePath(root, segments, cp.step, i === currentStep);
  }

  return root;
}

export function renderTreeLines(nodes: readonly TreeNode[], prefix: string = ""): readonly TreeLine[] {
  const lines: TreeLine[] = [];

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (node === undefined) continue;
    const isLastChild = i === nodes.length - 1;
    const connector = isLastChild ? "└── " : "├── ";
    const childPrefix = isLastChild ? "    " : "│   ";

    lines.push({
      prefix: prefix + connector,
      name: node.name,
      isFile: node.isFile,
      step: node.step,
      isCurrent: node.isCurrent,
    });

    if (node.children.length > 0) {
      const childLines = renderTreeLines(node.children, prefix + childPrefix);
      for (const line of childLines) {
        lines.push(line);
      }
    }
  }

  return lines;
}

export interface TreeLine {
  readonly prefix: string;
  readonly name: string;
  readonly isFile: boolean;
  readonly step: number | null;
  readonly isCurrent: boolean;
}
