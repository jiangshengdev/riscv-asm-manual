import Asciidoctor, { Table } from "asciidoctor";
import striptags from "striptags";
import { snakeCase, toUpper } from "lodash-es";
import fs from "fs";
import path from "path";

const asciidoctor = Asciidoctor();
const doc = asciidoctor.loadFile("../src/asm-manual.adoc");

const tables: Table[] = doc.findBy({ context: "table" }) as Table[];

const outputLines: string[] = [];

for (const table of tables) {
  const title = table.getTitle();
  if (title) {
    const cleanTitle = striptags(title).replace(/\..*$/, "");
    outputLines.push(`// ${cleanTitle}`);
    const varTitle = title2Var(cleanTitle);
    outputLines.push(`const ${varTitle} = `);
    const content = tableToJson(table);
    const lastColArr = getFirstColArrayFromRows(content);
    outputLines.push(JSON.stringify(lastColArr));
    outputLines.push("");
  }
}

// 写入 dist 目录下的文件
defineOutputFile(outputLines);

function defineOutputFile(lines: string[]) {
  const distDir = path.resolve(__dirname, "../dist");
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir);
  }
  const outPath = path.join(distDir, "adoc2json-output.js");
  fs.writeFileSync(outPath, lines.join("\n"), "utf-8");
  console.log(`输出已写入: ${outPath}`);
}

function title2Var(title: string): string {
  const noParen = title.replace(/\s*\([^)]*\)\s*/g, " ");
  return toUpper(snakeCase(noParen.trim()));
}

/**
 * 将表格内容转换为 JSON
 */
function tableToJson(table: Table) {
  const rows = table.getRows();
  let bodyRows = rows.body;

  // 跳过包含 <strong> 的表头行
  if (bodyRows.length > 0) {
    const firstRowText = bodyRows[0].map((cell) => cell.getText()).join("");
    if (firstRowText.includes("<strong>")) {
      bodyRows = bodyRows.slice(1);
    }
  }

  return bodyRows.map((row) => row.map((cell) => cell.getText()));
}

/**
 * 从二维数组 rows 获取每行第一列内容组成的数组
 */
function getFirstColArrayFromRows(rows: string[][]): string[] {
  const result: string[] = [];
  for (const row of rows) {
    let col = row.length > 0 ? striptags(row[0]) : "";
    if (col === "") break;
    // 只保留空格之前的内容
    col = col.split(" ")[0];
    result.push(col);
  }
  return result;
}
