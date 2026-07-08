const fs = require("fs");
const path = require("path");

const localesPath = "./src/locales/ru"; // поменяй если у тебя другой путь

const files = fs.readdirSync(localesPath)
    .filter(file => file.endsWith(".json"));

const usedKeys = new Set();

function scanFolder(folder) {
    const items = fs.readdirSync(folder);

    for (const item of items) {
        const full = path.join(folder, item);

        if (fs.statSync(full).isDirectory()) {
            scanFolder(full);
        } else {

            if (
                full.includes("node_modules") ||
                full.endsWith(".json") ||
                full.endsWith("check-i18n.js")
            ) continue;

            const text = fs.readFileSync(full, "utf8");


            const regex = /t\(["'`](.*?)["'`]\)/g;

            let match;

            while ((match = regex.exec(text)) !== null) {
                usedKeys.add(match[1]);
            }
        }
    }
}


scanFolder("./src"); 


for (const file of files) {

    const locale = JSON.parse(
        fs.readFileSync(
            path.join(localesPath, file),
            "utf8"
        )
    );


    const allKeys = Object.keys(locale);


    console.log("\n\n===== " + file + " =====");


    const unused = allKeys.filter(
        key => !usedKeys.has(key)
    );


    if (unused.length === 0) {
        console.log("🔥 Все ключи используются");
    } 
    else {

        console.log(
            "❌ UNUSED KEYS:"
        );

        unused.forEach(key => {
            console.log("-", key);
        });

    }
}