import * as Blockly from 'blockly/core';
import * as En from 'blockly/msg/en';
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import type { Program } from '@racer/shared';
import { registerCustomBlocks, STARTER_WORKSPACE_XML, TOOLBOX } from './blockDefinitions.js';
import { workspaceToProgram } from './workspaceToProgram.js';

export interface BlocklyWorkspaceHandle {
  getProgram: () => Program;
  /** Pass null to clear any current highlight. */
  setHighlightedBlock: (blockId: string | null) => void;
  /** Removes every block except the (non-deletable) start hat block. */
  resetWorkspace: () => void;
}

let blocksRegistered = false;

export const BlocklyWorkspace = forwardRef<BlocklyWorkspaceHandle>((_props, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<Blockly.WorkspaceSvg | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    if (!blocksRegistered) {
      Blockly.setLocale(En as unknown as { [key: string]: string });
      registerCustomBlocks();
      blocksRegistered = true;
    }

    const workspace = Blockly.inject(containerRef.current, {
      toolbox: TOOLBOX,
      trashcan: true,
      zoom: { controls: true, wheel: false, startScale: 1 },
    });
    Blockly.Xml.domToWorkspace(Blockly.utils.xml.textToDom(STARTER_WORKSPACE_XML), workspace);
    workspaceRef.current = workspace;

    return () => {
      workspace.dispose();
      workspaceRef.current = null;
    };
    // Intentionally mount/unmount only - same reasoning as RaceCanvas.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useImperativeHandle(ref, () => ({
    getProgram: () => {
      const workspace = workspaceRef.current;
      return workspace ? workspaceToProgram(workspace) : [];
    },
    setHighlightedBlock: (blockId: string | null) => {
      const workspace = workspaceRef.current;
      if (!workspace) return;
      // Passing null clears the current highlight (Blockly convention) -
      // always clear first so switching between two blocks doesn't
      // briefly show both highlighted.
      workspace.highlightBlock(null);
      if (blockId) workspace.highlightBlock(blockId);
    },
    resetWorkspace: () => {
      const workspace = workspaceRef.current;
      if (!workspace) return;
      workspace.clear();
      Blockly.Xml.domToWorkspace(Blockly.utils.xml.textToDom(STARTER_WORKSPACE_XML), workspace);
    },
  }));

  return <div ref={containerRef} style={{ height: 400, width: '100%' }} />;
});

BlocklyWorkspace.displayName = 'BlocklyWorkspace';
