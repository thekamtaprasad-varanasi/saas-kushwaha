const fs = require("fs");
const path = require("path");

const BASE = "F:\\saas-kushwaha";

const files = [
  "app\\psychologist\\page.js",
  "app\\psychologist\\[id]\\page.js",
  "app\\doctor\\patients\\page.js",
  "app\\doctor\\reminders\\page.js",
  "app\\doctor\\page.js",
  "app\\doctor\\[id]\\page.js",
  "app\\doctor\\h1-register\\page.js",
  "app\\doctor\\settings\\page.js",
  "app\\doctor\\pharmacy\\page.js",
  "app\\pharmacy\\page.js",
  "app\\pharmacy\\[id]\\page.js",
  "app\\pharmacy\\brands\\page.js",
  "app\\pharmacy\\walkin\\page.js",
  "app\\receptionist\\ReceptionistClient.js",
];

for (const f of files) {
  const filePath = path.join(BASE, f);

  if (!fs.existsSync(filePath)) {
    console.log(`SKIP (not found): ${f}`);
    continue;
  }

  let content = fs.readFileSync(filePath, "utf8");

  // 1. Import हटाओ
  content = content.replace(/import BottomNav from ['"]@\/components\/BottomNav['"];\r?\n/g, "");

  // 2. pb-24 → pb-4
  content = content.replace(/pb-24/g, "pb-4");

  // 3. <BottomNav role="..." /> हटाओ
  content = content.replace(/\s*<BottomNav role="[^"]*" \/>/g, "");

  fs.writeFileSync(filePath, content, "utf8");
  console.log(`DONE: ${f}`);
}

// BottomNav.js delete करो
const bottomNavPath = path.join(BASE, "components\\BottomNav.js");
if (fs.existsSync(bottomNavPath)) {
  fs.unlinkSync(bottomNavPath);
  console.log("DELETED: components\\BottomNav.js");
} else {
  console.log("SKIP (not found): components\\BottomNav.js");
}

console.log("\nसब हो गया!");