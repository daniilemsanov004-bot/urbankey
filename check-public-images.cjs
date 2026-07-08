const fs = require("fs");
const path = require("path");

const publicDir = "./public";


function getFiles(dir) {
    let files = [];

    for (const file of fs.readdirSync(dir)) {

        const full = path.join(dir, file);

        if (fs.statSync(full).isDirectory()) {
            files = files.concat(getFiles(full));
        } else {
            files.push(full);
        }
    }

    return files;
}


const images = getFiles(publicDir)
    .filter(file =>
        /\.(png|jpg|jpeg|webp|svg)$/i.test(file)
    );


const projectFiles = getFiles("./src");


console.log("\n=== НЕ НАЙДЕНЫЕ ===\n");


images.forEach(img => {

    const name = path.basename(img);

    let used = false;


    for (const file of projectFiles) {

        const text = fs.readFileSync(file, "utf8");

        if (text.includes(name)) {
            used = true;
            break;
        }

    }


    if (!used) {
        console.log(img);
    }

});