const fs = require("fs");

const path = "F:\\saas-kushwaha\\app\\layout.js";
let content = fs.readFileSync(path, "utf8");

content = content.replace(`import { cookies } from "next/headers";\r\n`, "");
content = content.replace(`import { cookies } from "next/headers";\n`, "");
content = content.replace("max-w-2xl mx-auto px-4 pt-16 pb-8", "max-w-5xl mx-auto px-4 pt-16 pb-8");

fs.writeFileSync(path, content, "utf8");
console.log("DONE");