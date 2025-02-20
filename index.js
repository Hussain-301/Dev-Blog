import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import fs from "fs";
import bodyParser from "body-parser";
import methodOverride from "method-override";

const app = express();
const port = 3001;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(methodOverride("_method"));

const uploadDir = path.join(__dirname, "public/uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "public/uploads/");
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

let articlesList = [];

const articlesFilePath = "articles.json";
if (fs.existsSync(articlesFilePath)) {
    articlesList = JSON.parse(fs.readFileSync(articlesFilePath, "utf8"));
}

function saveArticles() {
    fs.writeFileSync(articlesFilePath, JSON.stringify(articlesList, null, 4));
}

app.set("views", path.join(__dirname, "views"));
const logo = `assets/website_icon.png`;

app.get("/", (req, res) => {
    res.render("index", { icon_path: logo, articles: articlesList });
});

app.get("/about", (req, res) => {
    res.render("pages/about", { icon_path: logo, articles: articlesList });
});

app.get("/articles", (req, res) => {
    res.render("pages/articles", { icon_path: logo, articles: articlesList });
});

app.get("/post", (req, res) => {
    res.render("pages/post", { icon_path: logo, articles: articlesList });
});

app.post("/createNewArticle", upload.single("img_url"), (req, res) => {
    const { title, description, author } = req.body;
    const id = articlesList.length + 1;
    if (!req.file) return res.send("File upload failed. Please select an image.");
    const img_url = `/uploads/${req.file.filename}`;

    const newArticle = { id, title, description, img_url, author };
    articlesList.push(newArticle);
    saveArticles();

    fs.writeFileSync(
        path.join(__dirname, "views/articles", `${id}.ejs`),
        `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link rel="stylesheet" href="../../styles/main.css">
            <link rel="shortcut icon" href="<%= icon_path %>" type="image/x-icon">
            <title>Dev Blog</title>
        </head>
        <body>
        <%- include('../partials/header.ejs') %>
        <%- include('../partials/articlesfs.ejs') %>
        <%- include('../partials/footer.ejs') %>
        </body>
        </html>
        `
        
    );

    res.redirect("/articles");
});

app.get("/articles/:id", (req, res) => {
    const article = articlesList.find((a) => a.id == req.params.id);
    if (!article) return res.status(404).send("Article not found");
    res.render(`articles/${article.id}`, { article, icon_path: logo });
});

app.get("/articles/edit/:id", (req, res) => {
    const article = articlesList.find((a) => a.id == req.params.id);
    if (!article) return res.status(404).send("Article not found");
    res.render("pages/edit", { article, icon_path: logo });
});

app.patch("/editAnArticle/:id", upload.single("img_url"), (req, res) => {
    const { title, description, author } = req.body;
    const id = parseInt(req.params.id);
    const articleIndex = articlesList.findIndex(a => a.id === id);
    if (articleIndex === -1) return res.status(404).send("Article not found");

    if (title) articlesList[articleIndex].title = title;
    if (description) articlesList[articleIndex].description = description;
    if (author) articlesList[articleIndex].author = author;
    if (req.file) articlesList[articleIndex].img_url = `/uploads/${req.file.filename}`;

    saveArticles();
    res.redirect(`/articles/${id}`);
});


function deleteAnArticle(id) {
    const articleIndex = articlesList.findIndex(a => a.id == id);
    if (articleIndex === -1) return false; 

    const article = articlesList[articleIndex];

    articlesList.splice(articleIndex, 1);
    saveArticles();

    
    const articlePagePath = path.join(__dirname, "views/articles", `${id}.ejs`);
    if (fs.existsSync(articlePagePath)) {
        fs.unlinkSync(articlePagePath);
    }

    return true;
}


app.delete("/deleteAnArticle/:id", (req, res) => {
    const articleId = req.params.id;
    
    if (deleteAnArticle(articleId)) {
        res.redirect("/articles");
    } else {
        res.status(404).send("Article not found");
    }
});





app.listen(port, () => console.log(`Server running at http://localhost:${port}`));
