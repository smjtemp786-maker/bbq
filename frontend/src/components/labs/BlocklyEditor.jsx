import React, { useEffect, useImperativeHandle, useRef, forwardRef } from "react";
import { defineBrainBondsBlocks, Blockly, javascriptGenerator } from "@/lib/blocklyBlocks";
import { useTheme } from "@/context/ThemeContext";

const BlocklyEditor = forwardRef(function BlocklyEditor({ toolbox, initialXml }, ref) {
  const containerRef = useRef(null);
  const wsRef = useRef(null);
  const { theme } = useTheme();

  useImperativeHandle(ref, () => ({
    getCode: () => {
      if (!wsRef.current) return "";
      javascriptGenerator.STATEMENT_PREFIX = null;
      return javascriptGenerator.workspaceToCode(wsRef.current);
    },
    getXml: () => {
      if (!wsRef.current) return "";
      const dom = Blockly.Xml.workspaceToDom(wsRef.current);
      return Blockly.Xml.domToText(dom);
    },
    loadXml: (xml) => {
      if (!wsRef.current || !xml) return;
      try {
        wsRef.current.clear();
        const dom = Blockly.utils.xml.textToDom(xml);
        Blockly.Xml.domToWorkspace(dom, wsRef.current);
      } catch (e) {}
    },
    clear: () => wsRef.current && wsRef.current.clear(),
  }));

  useEffect(() => {
    defineBrainBondsBlocks();
    const bbTheme = Blockly.Theme.defineTheme("bb", {
      base: Blockly.Themes.Classic,
      componentStyles: {
        workspaceBackgroundColour: theme === "dark" ? "#0f172a" : "#f8fafc",
        toolboxBackgroundColour: theme === "dark" ? "#111827" : "#ffffff",
        flyoutBackgroundColour: theme === "dark" ? "#1f2937" : "#f1f5f9",
        scrollbarColour: "#94a3b8",
      },
    });
    const ws = Blockly.inject(containerRef.current, {
      toolbox,
      renderer: "zelos",
      theme: bbTheme,
      grid: { spacing: 24, length: 3, colour: theme === "dark" ? "#1e293b" : "#e2e8f0", snap: true },
      zoom: { controls: true, wheel: true, startScale: 0.9, maxScale: 2, minScale: 0.4 },
      trashcan: true,
      move: { scrollbars: true, drag: true, wheel: true },
    });
    wsRef.current = ws;
    if (initialXml) {
      try {
        Blockly.Xml.domToWorkspace(Blockly.utils.xml.textToDom(initialXml), ws);
      } catch (e) {}
    }
    const onResize = () => Blockly.svgResize(ws);
    window.addEventListener("resize", onResize);
    const ro = new ResizeObserver(() => Blockly.svgResize(ws));
    ro.observe(containerRef.current);
    return () => {
      window.removeEventListener("resize", onResize);
      ro.disconnect();
      ws.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toolbox, theme]);

  return <div ref={containerRef} className="h-full w-full" data-testid="blockly-workspace" />;
});

export default BlocklyEditor;
